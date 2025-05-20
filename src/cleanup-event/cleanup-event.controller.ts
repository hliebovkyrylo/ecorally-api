import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CleanupEventService } from './cleanup-event.service';
import { UpsertCleanupEventDto } from './dto/upsert-cleanup-event.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/auth.guard';
import { GetCleanupEventsQueryDto } from './dto/get-cleanup-events-query';

@Controller('cleanup-events')
export class CleanupEventController {
  constructor(private readonly cleanupEventService: CleanupEventService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  async createCleanupEvent(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() data: UpsertCleanupEventDto,
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

  @Get()
  async getCleanupEvents(
    @Query() query: GetCleanupEventsQueryDto,
    @Res() res: FastifyReply,
  ) {
    const cleanupEventsResult =
      await this.cleanupEventService.getCleanupEvents(query);

    return res.send(cleanupEventsResult);
  }

  @Put(':cleanupEventId/update')
  @UseGuards(AuthGuard)
  async updateCleanupEvent(
    @Param('cleanupEventId') cleanupEventId: string,
    @Body() data: UpsertCleanupEventDto,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const user = req.user as User;
    const cleanupEvent = await this.cleanupEventService.updateCleanupEvent(
      data,
      cleanupEventId,
      user.id,
    );

    return res.send(cleanupEvent);
  }
}
