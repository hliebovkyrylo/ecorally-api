import { MailerService } from '@nestjs-modules/mailer';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { type User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CheckOtpDto } from './dto/check-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailerService,
  ) {}

  async generateAndSendOtp(user: User) {
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

    return { message: 'Code sent' };
  }

  async checkOtp(data: CheckOtpDto, userId: string) {
    try {
      const userCode = await this.prisma.otp.findUnique({
        where: { userId },
      });

      if (!userCode) {
        throw new NotFoundException('Code for this user not found');
      }

      const isValid = await bcrypt.compare(data.code.toString(), userCode.code);

      if (!isValid) {
        throw new ConflictException('Invalid code');
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
