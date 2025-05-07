import { Test } from '@nestjs/testing';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CheckOtpDto } from './dto/check-otp.dto';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';

describe('OtpController', () => {
  let otpController: OtpController;
  let otpService: OtpService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OtpController],
      providers: [
        {
          provide: OtpService,
          useValue: {
            checkOtp: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    otpController = module.get<OtpController>(OtpController);
    otpService = module.get<OtpService>(OtpService);
  });

  describe('checkOtp', () => {
    const checkOtpDto: CheckOtpDto = { code: 123456 };
    const user: User = {
      id: 'user-id',
      name: 'name',
      email: 'email',
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: true,
    };
    const req = { user } as Request;

    it('should call otpService.checkOtp with correct parameters', async () => {
      const checkOtpSpy = jest
        .spyOn(otpService, 'checkOtp')
        .mockResolvedValue({ isValid: true });

      const response = await otpController.checkOtp(checkOtpDto, req);

      expect(checkOtpSpy).toHaveBeenCalledWith(checkOtpDto.code, user.id);
      expect(response).toEqual({ isValid: true });
    });

    it('should throw NotFoundException when service throws it', async () => {
      jest
        .spyOn(otpService, 'checkOtp')
        .mockRejectedValue(
          new NotFoundException('Code for this user not found'),
        );

      await expect(otpController.checkOtp(checkOtpDto, req)).rejects.toThrow(
        new NotFoundException('Code for this user not found'),
      );
    });

    it('should throw ConflictException when service throws it', async () => {
      jest
        .spyOn(otpService, 'checkOtp')
        .mockRejectedValue(new ConflictException('Invalid code'));

      await expect(otpController.checkOtp(checkOtpDto, req)).rejects.toThrow(
        new ConflictException('Invalid code'),
      );
    });

    it('should throw InternalServerErrorException when service throws it', async () => {
      jest
        .spyOn(otpService, 'checkOtp')
        .mockRejectedValue(
          new InternalServerErrorException('An unexpected error occurred'),
        );

      await expect(otpController.checkOtp(checkOtpDto, req)).rejects.toThrow(
        new InternalServerErrorException('An unexpected error occurred'),
      );
    });
  });
});
