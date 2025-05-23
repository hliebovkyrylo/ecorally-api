import { Controller } from '@nestjs/common';
import { ContaminatedPointService } from './contaminated-point.service';

@Controller('contaminated-point')
export class ContaminatedPointController {
  constructor(
    private readonly contaminatedPointService: ContaminatedPointService,
  ) {}
}
