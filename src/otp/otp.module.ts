import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, MailModule, RedisModule],
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
