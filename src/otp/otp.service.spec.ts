import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

jest.mock('bcrypt');

describe('OtpService', () => {
  let otpService: OtpService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let mailService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            otp: {
              findUnique: jest.fn(),
              delete: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn().mockImplementation(() => Promise.resolve(null)),
            set: jest.fn().mockImplementation(() => Promise.resolve()),
            increment: jest.fn().mockImplementation(() => Promise.resolve(1)),
          },
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockImplementation(() => Promise.resolve()),
          },
        },
      ],
    }).compile();

    otpService = module.get<OtpService>(OtpService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    mailService = module.get<MailerService>(MailerService);
  });

  describe('generateAndSendOtp', () => {
    const email = 'test@example.com';
    const user = {
      id: 'user-id',
      name: 'Test User',
      email,
      password: 'hashedPassword',
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate and send OTP successfully for existing user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(prismaService.otp, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt as any, 'hash').mockResolvedValue('hashedOtp');
      jest.spyOn(mailService, 'sendMail').mockResolvedValue(undefined);
      jest.spyOn(redisService, 'increment').mockResolvedValue(1);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (cb) => {
          await cb(prismaService);
        });

      const result = await otpService.generateAndSendOtp(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: { id: true, email: true },
      });
      expect(redisService.get).toHaveBeenCalledWith(`otp:lock:${email}`);
      expect(redisService.get).toHaveBeenCalledWith(`otp:rateLimit:${email}`);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(prismaService.otp.create).toHaveBeenCalledWith({
        data: {
          code: 'hashedOtp',
          userId: user.id,
        },
      });
      expect(mailService.sendMail).toHaveBeenCalledWith({
        to: user.email,
        subject: 'Confirmation Code',
        template: 'confirm-code',
        context: {
          email: user.email,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          code: expect.any(String),
        },
      });
      expect(redisService.increment).toHaveBeenCalledWith(
        `otp:rateLimit:${email}`,
        3600,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `otp:lock:${email}`,
        '1',
        60,
      );
      expect(result).toEqual({ message: 'Code sent' });
    });

    it('should return message for non-existing user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await otpService.generateAndSendOtp(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: { id: true, email: true },
      });
      expect(result).toEqual('Code sent if email exists');
    });

    it('should throw ConflictException when cooldown is active', async () => {
      jest.spyOn(redisService, 'get').mockResolvedValue('1');

      await expect(otpService.generateAndSendOtp(email)).rejects.toThrow(
        new ConflictException(
          'Please wait 1 minute before requesting a new code',
        ),
      );
    });

    it('should throw ConflictException when max attempts reached', async () => {
      jest.spyOn(redisService, 'get').mockImplementation((key: string) => {
        if (key === `otp:lock:${email}`) return Promise.resolve(null);
        if (key === `otp:rateLimit:${email}`) return Promise.resolve('5');
        return Promise.resolve(null);
      });

      await expect(otpService.generateAndSendOtp(email)).rejects.toThrow(
        new ConflictException('Too many requests. Try again later.'),
      );
    });

    it('should delete existing OTP before creating new one', async () => {
      const existingOtp = {
        id: 'otp-id',
        userId: user.id,
        code: 'oldHash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest
        .spyOn(prismaService.otp, 'findUnique')
        .mockResolvedValue(existingOtp);
      jest.spyOn(bcrypt as any, 'hash').mockResolvedValue('hashedOtp');
      jest.spyOn(mailService, 'sendMail').mockResolvedValue(undefined);
      jest.spyOn(redisService, 'increment').mockResolvedValue(1);
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (cb) => {
          await cb(prismaService);
        });

      await otpService.generateAndSendOtp(email);

      expect(prismaService.otp.delete).toHaveBeenCalledWith({
        where: { id: existingOtp.id },
      });
      expect(prismaService.otp.create).toHaveBeenCalledWith({
        data: {
          code: 'hashedOtp',
          userId: user.id,
        },
      });
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(new Error('Database error'));

      await expect(otpService.generateAndSendOtp(email)).rejects.toThrow(
        new InternalServerErrorException('Database error'),
      );
    });
  });
});
