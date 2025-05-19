import { Module } from '@nestjs/common';
import { CleanupEventService } from './cleanup-event.service';
import { CleanupEventController } from './cleanup-event.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [CleanupEventController],
  providers: [CleanupEventService, PrismaService],
})
export class CleanupEventModule {}
