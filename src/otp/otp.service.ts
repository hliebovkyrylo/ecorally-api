import { MailerService } from '@nestjs-modules/mailer';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailerService,
    private readonly redisService: RedisService,
  ) {}

  async generateAndSendOtp(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    const rateLimitKey = `otp:rateLimit:${email}`;
    const otpCooldownKey = `otp:lock:${email}`;
    const maxAttempts = 5;
    const ttl = 3600;
    const cooldownTtl = 60;

    const cooldown = await this.redisService.get(otpCooldownKey);
    if (cooldown) {
      throw new ConflictException(
        'Please wait 1 minute before requesting a new code',
      );
    }

    const currentAttempts = await this.redisService.get(rateLimitKey);
    const attempts = currentAttempts ? parseInt(currentAttempts, 10) : 0;

    if (attempts >= maxAttempts) {
      throw new ConflictException('Too many requests. Try again later.');
    }

    if (!user) {
      return 'Code sent if email exists';
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.$transaction(async (prisma) => {
      const existingOtp = await prisma.otp.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (existingOtp) {
        await prisma.otp.delete({ where: { id: existingOtp.id } });
      }

      await prisma.otp.create({
        data: {
          code: hashedOtp,
          userId: user.id,
        },
      });
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Confirmation Code',
      template: 'confirm-code',
      context: {
        email: user.email,
        code: otp,
      },
    });

    await this.redisService.increment(rateLimitKey, ttl);
    await this.redisService.set(otpCooldownKey, '1', cooldownTtl);

    return { message: 'Code sent' };
  }

  async checkOtp(code: number, userId: string) {
    try {
      const userCode = await this.prisma.otp.findUnique({
        where: { userId },
      });

      if (!userCode) {
        throw new NotFoundException('Code for this user not found');
      }

      const isExpired =
        Date.now() - userCode.createdAt.getTime() >= 10 * 60 * 1000;

      if (isExpired) {
        await this.prisma.otp.delete({
          where: { id: userCode.id },
        });
        throw new ConflictException('Code expired');
      }

      const isValid = await bcrypt.compare(code.toString(), userCode.code);

      if (!isValid) {
        throw new ConflictException('Invalid data provided');
      }

      await this.prisma.otp.delete({
        where: { id: userCode.id },
      });

      return { isValid };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof ConflictException) {
        throw error;
      } else {
        throw new InternalServerErrorException('An unexpected error occurred');
      }
    }
  }
}
