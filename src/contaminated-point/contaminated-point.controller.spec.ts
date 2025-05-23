import { Test, TestingModule } from '@nestjs/testing';
import { ContaminatedPointController } from './contaminated-point.controller';
import { ContaminatedPointService } from './contaminated-point.service';

describe('ContaminatedPointController', () => {
  let controller: ContaminatedPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContaminatedPointController],
      providers: [ContaminatedPointService],
    }).compile();

    controller = module.get<ContaminatedPointController>(
      ContaminatedPointController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
