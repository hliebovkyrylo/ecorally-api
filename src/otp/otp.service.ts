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

    await this.prisma.otp.create({
      data: {
        code: otp,
        userId: user.id,
      },
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Confirmation Code',
      template: 'confirm-code',
      context: {
        otp,
      },
    });

    return { message: "Code sent" }
  }
}
