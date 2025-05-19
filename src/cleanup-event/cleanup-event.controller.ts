import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CleanupEventService } from './cleanup-event.service';
import { CreateCleanupEventDto } from './dto/create-cleanup-event.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('cleanup-event')
export class CleanupEventController {
  constructor(private readonly cleanupEventService: CleanupEventService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  async createCleanupEvent(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() data: CreateCleanupEventDto,
  ) {
    const user = req.user as User;
    const cleanupEvent = await this.cleanupEventService.createCleanupEvent(
      data,
      user.id,
    );

    return res.send(cleanupEvent);
  }

  @Get(':cleanupEventId')
  async getCleanupEventById(
    @Param('cleanupEventId') cleanupEventId: string,
    @Res() res: FastifyReply,
  ) {
    const cleanupEvent =
      await this.cleanupEventService.getCleanupEventById(cleanupEventId);
    return res.send(cleanupEvent);
  }
}
