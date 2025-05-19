import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { OtpModule } from './otp/otp.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { CleanupEventModule } from './cleanup-event/cleanup-event.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    OtpModule,
    MailModule,
    RedisModule,
    UserModule,
    CleanupEventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
