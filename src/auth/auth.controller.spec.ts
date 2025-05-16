import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { FastifyReply } from 'fastify';
import { SignInDto } from './dto/sign-in.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    refreshToken: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as FastifyReply;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: AuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should set refresh token cookie and return accessToken', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      };
      const result = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockAuthService.signUp.mockResolvedValue(result);

      await controller.signUp(signUpDto, mockResponse);

      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        result.refreshToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        },
      );
      expect(mockResponse.send).toHaveBeenCalledWith({
        accessToken: result.accessToken,
      });
    });
  });

  describe('signIn', () => {
    it('should set refreshToken cookie and return accessToken', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password',
      };
      const result = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockAuthService.signIn.mockResolvedValue(result);

      await controller.signIn(signInDto, mockResponse);

      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        result.refreshToken,
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        },
      );
      expect(mockResponse.send).toHaveBeenCalledWith({
        accessToken: result.accessToken,
      });
    });
  });

  describe('refreshToken', () => {
    it('should set refreshToken cookie and return accessToken', async () => {
      const tokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
      const req = {
        headers: { authorization: 'Bearer some-token' },
        cookies: { refreshToken: 'mock-refresh' },
      };

      const res = mockResponse;
      mockAuthService.refreshToken.mockResolvedValue(tokens);

      await controller.refreshToken(res as any, req as any);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        req.headers.authorization,
        req.cookies.refreshToken,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: !!process.env.IS_PRODUCTION,
          sameSite: 'strict',
        }),
      );
      expect(res.send).toHaveBeenCalledWith({
        accessToken: tokens.accessToken,
      });
    });
  });

  describe('reset-password', () => {
    it('should update user password if valid code provided', async () => {
      const responseMessage = 'Password was successfully updated';
      const mockData: ResetPasswordDto = {
        email: 'test@test.ts',
        code: 111111,
        password: '1234567890',
        confirmPassword: '1234567890',
      };

      mockAuthService.resetPassword.mockResolvedValue(responseMessage);

      await controller.resetPassword(mockResponse, mockData);

      expect(mockResponse.send).toHaveBeenCalledWith({
        message: responseMessage,
      });
    });
  });
});
