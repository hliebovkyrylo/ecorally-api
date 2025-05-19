import { Test, TestingModule } from '@nestjs/testing';
import { CleanupEventController } from './cleanup-event.controller';
import { CleanupEventService } from './cleanup-event.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CleanupEventController', () => {
  let controller: CleanupEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CleanupEventController],
      providers: [CleanupEventService, PrismaService],
    }).compile();

    controller = module.get<CleanupEventController>(CleanupEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
