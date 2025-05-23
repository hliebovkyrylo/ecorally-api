import { Module } from '@nestjs/common';
import { ContaminatedPointService } from './contaminated-point.service';
import { ContaminatedPointController } from './contaminated-point.controller';

@Module({
  controllers: [ContaminatedPointController],
  providers: [ContaminatedPointService],
})
export class ContaminatedPointModule {}
