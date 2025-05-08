import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as tokenUtils from '../utils/tokens.util';
import { Prisma } from '@prisma/client';
import { OtpService } from '../otp/otp.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  const mockOtpService = {
    checkOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            blacklistToken: {
              findUnique: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const signUpDto = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };
    const hashedPassword = 'hashedPassword';
    const user = {
      id: 'user-id',
      email: signUpDto.email,
      name: 'test',
      password: hashedPassword,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';

    beforeEach(() => {
      jest.spyOn(bcrypt as any, 'hash').mockResolvedValue(hashedPassword);
      jest.spyOn(tokenUtils, 'createAccessToken').mockReturnValue(accessToken);
      jest
        .spyOn(tokenUtils, 'createRefreshToken')
        .mockReturnValue(refreshToken);
    });

    it('should successfully sign up a user and return tokens', async () => {
      const createUserSpy = jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(user);

      const result = await authService.signUp(signUpDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(signUpDto.password, 8);
      expect(createUserSpy).toHaveBeenCalledWith({
        data: {
          email: signUpDto.email,
          name: 'test',
          password: hashedPassword,
        },
      });
      expect(tokenUtils.createAccessToken).toHaveBeenCalledWith(user.id);
      expect(tokenUtils.createRefreshToken).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ accessToken, refreshToken });
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '',
        }),
      );

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should throw original error for non-P2002 errors', async () => {
      const error = new Error('Unexpected error');
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(error);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(error);
    });
  });

  describe('signIn', () => {
    const signInDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const user = {
      id: 'user-id',
      email: signInDto.email,
      name: 'test',
      password: 'hashedPassword',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';

    beforeEach(() => {
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true);
      jest.spyOn(tokenUtils, 'createAccessToken').mockReturnValue(accessToken);
      jest
        .spyOn(tokenUtils, 'createRefreshToken')
        .mockReturnValue(refreshToken);
    });

    it('should successfully sign in a user and return tokens', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);

      const result = await authService.signIn(signInDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        signInDto.password,
        user.password,
      );
      expect(tokenUtils.createAccessToken).toHaveBeenCalledWith(user.id);
      expect(tokenUtils.createRefreshToken).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ accessToken, refreshToken });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw ConflictException if password is invalid', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(false);

      await expect(authService.signIn(signInDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(authService.signIn(signInDto)).rejects.toThrow(
        'Invalid data provided',
      );
    });
  });

  describe('refreshToken', () => {
    const userId = 'user-id';
    const validRefreshToken = 'valid-refresh-token';
    const validAccessToken = 'valid-access-token';
    const newAccessToken = 'new-access-token';
    const newRefreshToken = 'new-refresh-token';

    beforeEach(() => {
      jest.spyOn(tokenUtils, 'verifyToken').mockImplementation((token) => {
        if (token === validRefreshToken || token === validAccessToken) {
          return userId;
        }
        throw new JsonWebTokenError('Invalid token');
      });

      jest
        .spyOn(tokenUtils, 'createAccessToken')
        .mockResolvedValue(newAccessToken as never);
      jest
        .spyOn(tokenUtils, 'createRefreshToken')
        .mockResolvedValue(newRefreshToken as never);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw UnauthorizedException if refreshToken is not provided', async () => {
      await expect(authService.refreshToken(validAccessToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshToken(validAccessToken)).rejects.toThrow(
        'Refresh token is required',
      );
    });

    it('should throw ForbiddenException if refreshToken is invalid', async () => {
      jest.spyOn(tokenUtils, 'verifyToken').mockImplementation(() => {
        throw new JsonWebTokenError('Invalid token');
      });

      await expect(
        authService.refreshToken(validAccessToken, 'invalid-refresh-token'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        authService.refreshToken(validAccessToken, 'invalid-refresh-token'),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw ForbiddenException if refreshToken is blacklisted', async () => {
      jest.spyOn(prismaService.blacklistToken, 'findUnique').mockResolvedValue({
        id: 'blacklist-id',
        userId,
        token: validRefreshToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.refreshToken(validAccessToken, validRefreshToken),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        authService.refreshToken(validAccessToken, validRefreshToken),
      ).rejects.toThrow('Refresh token is revoked');
    });

    it('should blacklist both tokens and return new ones if both are valid and userId matches', async () => {
      jest
        .spyOn(prismaService.blacklistToken, 'findUnique')
        .mockResolvedValue(null);
      jest
        .spyOn(prismaService.blacklistToken, 'createMany')
        .mockResolvedValue({ count: 2 });

      const result = await authService.refreshToken(
        validAccessToken,
        validRefreshToken,
      );

      expect(prismaService.blacklistToken.createMany).toHaveBeenCalledWith({
        data: [
          { token: validRefreshToken, userId },
          { token: validAccessToken, userId },
        ],
      });

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });

    it('should only blacklist refresh token if access token is not provided', async () => {
      jest
        .spyOn(prismaService.blacklistToken, 'findUnique')
        .mockResolvedValue(null);
      jest
        .spyOn(prismaService.blacklistToken, 'createMany')
        .mockResolvedValue({ count: 1 });

      const result = await authService.refreshToken(
        undefined,
        validRefreshToken,
      );

      expect(prismaService.blacklistToken.createMany).toHaveBeenCalledWith({
        data: [{ token: validRefreshToken, userId }],
      });

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      jest
        .spyOn(prismaService.blacklistToken, 'findUnique')
        .mockRejectedValue(new Error('Unexpected error'));

      await expect(
        authService.refreshToken(validAccessToken, validRefreshToken),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        authService.refreshToken(validAccessToken, validRefreshToken),
      ).rejects.toThrow('Failed to refresh token');
    });
  });

  describe('resetPassword', () => {
    const userId = 'userId';
    const resetPasswordMockData = {
      code: 123456,
      password: 'password',
      confirmPassword: 'confirmPassword',
    };

    it('should return a success message after resetting the password', async () => {
      mockOtpService.checkOtp.mockResolvedValue(true);

      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({ id: userId } as any);

      const result = await authService.resetPassword(
        resetPasswordMockData,
        userId,
      );

      expect(mockOtpService.checkOtp).toHaveBeenCalledWith(123456, userId);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: { password: expect.any(String) },
      });
      expect(result).toBe('Password was successfully updated');
    });

    it('should throw ConflictException when provided code is invalid', async () => {
      mockOtpService.checkOtp.mockResolvedValue(false);

      await expect(
        authService.resetPassword(resetPasswordMockData, userId),
      ).rejects.toThrow(ConflictException);
    });
  });
});
