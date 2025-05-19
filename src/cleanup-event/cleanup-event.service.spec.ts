import { Test, TestingModule } from '@nestjs/testing';
import { CleanupEventService } from './cleanup-event.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CleanupEventService', () => {
  let service: CleanupEventService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CleanupEventService, PrismaService],
    }).compile();

    service = module.get<CleanupEventService>(CleanupEventService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
