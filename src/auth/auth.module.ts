import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, OtpService],
})
export class AuthModule {}
