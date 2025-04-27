import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { type User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailerService,
  ) {}

  async generateAndSendOtp(user: User) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
          code: otp,
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
}
