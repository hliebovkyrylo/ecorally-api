import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

jest.mock('bcrypt');

describe('OtpService', () => {
  let otpService: OtpService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: {
            otp: {
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: MailerService,
          useValue: {},
        },
      ],
    }).compile();

    otpService = module.get<OtpService>(OtpService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('checkOtp', () => {
    const userId = 'user-id';
    const data = { code: 123456 };

    it('should return { isValid: true } when OTP is valid', async () => {
      const mockOtp = {
        id: 'otp123',
        userId,
        code: 'hashedCode',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prismaService.otp, 'findUnique').mockResolvedValue(mockOtp);
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(true);
      jest.spyOn(prismaService.otp, 'delete').mockResolvedValue(mockOtp);

      const result = await otpService.checkOtp(data, userId);

      expect(prismaService.otp.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        data.code.toString(),
        mockOtp.code,
      );
      expect(prismaService.otp.delete).toHaveBeenCalledWith({
        where: { id: mockOtp.id },
      });
      expect(result).toEqual({ isValid: true });
    });

    it('should throw NotFoundException when OTP is not found', async () => {
      jest.spyOn(prismaService.otp, 'findUnique').mockResolvedValue(null);

      await expect(otpService.checkOtp(data, userId)).rejects.toThrow(
        new NotFoundException('Code for this user not found'),
      );
    });

    it('should throw ConflictException when user provided invalid code', async () => {
      const mockOtp = {
        id: 'otp123',
        userId,
        code: 'hashedCode',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prismaService.otp, 'findUnique').mockResolvedValue(mockOtp);
      jest.spyOn(bcrypt as any, 'compare').mockResolvedValue(false);

      await expect(otpService.checkOtp(data, userId)).rejects.toThrow(
        new ConflictException('Invalid code'),
      );
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      jest
        .spyOn(prismaService.otp, 'findUnique')
        .mockRejectedValue(new Error('Database error'));

      await expect(otpService.checkOtp(data, userId)).rejects.toThrow(
        new InternalServerErrorException('An unexpected error occurred'),
      );
    });

    it('should throw ConflictException when OTP is expired', async () => {
      const mockOtp = {
        id: 'otp123',
        userId,
        code: 'hashedCode',
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
        updatedAt: new Date(),
      };
      jest.spyOn(prismaService.otp, 'findUnique').mockResolvedValue(mockOtp);

      await expect(otpService.checkOtp(data, userId)).rejects.toThrow(
        new ConflictException('Code expired'),
      );
    });
  });
});
