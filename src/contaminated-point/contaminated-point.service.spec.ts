import { Test, TestingModule } from '@nestjs/testing';
import { ContaminatedPointService } from './contaminated-point.service';

describe('ContaminatedPointService', () => {
  let service: ContaminatedPointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContaminatedPointService],
    }).compile();

    service = module.get<ContaminatedPointService>(ContaminatedPointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
