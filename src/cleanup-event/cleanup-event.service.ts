import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertCleanupEventDto } from './dto/upsert-cleanup-event.dto';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { UpsertCleanupEventLocationDto } from './dto/upsert-cleanup-event-location.dto';
import { NominatimResponse } from './types/nominatim-response';
import { RedisService } from '../redis/redis.service';
import { CleanupEvent } from './types/cleanup-event';
import { Prisma } from '@prisma/client';
import { GetCleanupEventsQueryDto } from './dto/get-cleanup-events-query';
import { SortBy } from './enum/get-cleanup-events-sort-options.enum';

@Injectable()
export class CleanupEventService {
  private readonly nominatimUrl: string;
  private readonly logger = new Logger(CleanupEventService.name);
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    this.nominatimUrl =
      process.env.NOMINATIM_URL ||
      'https://nominatim.openstreetmap.org/reverse';
    if (!this.nominatimUrl) {
      throw new BadRequestException(
        'Environment variable NOMINATIM_URL is not set',
      );
    }

    axiosRetry(axios, {
      retries: 3,
      retryDelay: (retryCount: number) => retryCount * 1000,
    });
  }

  async getCleanupEventById(cleanupEventId: string) {
    const cacheKey = `cleanup-event:${cleanupEventId}`;
    const cachedEvent = await this.redisService.get(cacheKey);
    if (cachedEvent) {
      this.logger.debug(`Cache hit for cleanup event ${cleanupEventId}`);
      return JSON.parse(cachedEvent) as CleanupEvent;
    }

    try {
      const cleanupEvent = await this.prisma.cleanupEvent.findUnique({
        where: { id: cleanupEventId },
        include: {
          settlement: {
            select: {
              name: true,
              latitude: true,
              longitude: true,
              region: {
                select: {
                  latitude: true,
                  longitude: true,
                  name: true,
                },
              },
            },
          },
          location: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
          takePart: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!cleanupEvent) {
        throw new NotFoundException(
          `Cleanup event with ID ${cleanupEventId} not found`,
        );
      }

      await this.redisService.set(
        cacheKey,
        JSON.stringify(cleanupEvent),
        this.CACHE_TTL,
      );

      return cleanupEvent;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to retrieve cleanup event',
      );
    }
  }

  async createCleanupEvent(data: UpsertCleanupEventDto, userId: string) {
    try {
      const isPointInsideInCorrectSettlement = await this.isPointInSettlement(
        data.location,
        data.settlementId,
      );

      if (!isPointInsideInCorrectSettlement)
        throw new ConflictException(
          'The selected point is outside the selected locality',
        );

      return this.prisma.$transaction(async () => {
        const cleanupEvent = await this.prisma.cleanupEvent.create({
          data: {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status,
            imageUrl: data.imageUrl,
            settlementId: data.settlementId,
            organizerId: userId,
          },
        });

        await Promise.all([
          this.prisma.cleanupEventLocation.createMany({
            data: [
              {
                eventId: cleanupEvent.id,
                ...data.location,
                settlementId: data.settlementId,
              },
            ],
          }),
          this.prisma.cleanupEventDate.createMany({
            data: data.dates.map((dateDto) => ({
              eventId: cleanupEvent.id,
              date: dateDto.date,
            })),
          }),
          this.prisma.cleanupEquipment.createMany({
            data: data.equipments.map((equipmentDto) => ({
              eventId: cleanupEvent.id,
              ...equipmentDto,
            })),
          }),
        ]);

        return cleanupEvent;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Failed to create cleanup event');
    }
  }

  async updateCleanupEvent(
    data: UpsertCleanupEventDto,
    cleanupEventId: string,
    userId: string,
  ): Promise<CleanupEvent> {
    try {
      const cleanupEvent = await this.prisma.cleanupEvent.findUnique({
        where: { id: cleanupEventId },
      });

      if (!cleanupEvent) {
        throw new NotFoundException(
          `Event with ID ${cleanupEventId} not found.`,
        );
      }

      if (cleanupEvent.organizerId !== userId) {
        throw new ForbiddenException(
          'You have no access to change this event.',
        );
      }

      if (data.startDate && data.endDate && data.startDate > data.endDate) {
        throw new ConflictException('Date must be before of the end date.');
      }

      if (data.dates) {
        const invalidDates = data.dates.filter(
          (dateDto) =>
            dateDto.date < data.startDate || dateDto.date > data.endDate,
        );
        if (invalidDates.length > 0) {
          throw new ConflictException(
            'Dates must be in scope startDate and endDate.',
          );
        }
      }

      const isPointInsideInCorrectSettlement = await this.isPointInSettlement(
        data.location,
        data.settlementId,
      );

      if (!isPointInsideInCorrectSettlement) {
        throw new ConflictException(
          'The selected point is outside the selected settlement.',
        );
      }

      const updatedEvent = await this.prisma.$transaction(async (tx) => {
        const updatedCleanupEvent = await tx.cleanupEvent.update({
          where: { id: cleanupEventId },
          data: {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status,
            imageUrl: data.imageUrl,
            settlementId: data.settlementId,
            organizerId: userId,
          },
          include: {
            settlement: {
              select: {
                name: true,
                latitude: true,
                longitude: true,
                region: {
                  select: {
                    name: true,
                    latitude: true,
                    longitude: true,
                  },
                },
              },
            },
            location: {
              select: {
                latitude: true,
                longitude: true,
              },
            },
            takePart: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        await tx.cleanupEventLocation.upsert({
          where: { eventId: cleanupEventId },
          update: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            settlementId: data.settlementId,
          },
          create: {
            eventId: cleanupEventId,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            settlementId: data.settlementId,
          },
        });

        await Promise.all([
          tx.cleanupEventDate.deleteMany({
            where: { eventId: cleanupEventId },
          }),
          tx.cleanupEquipment.deleteMany({
            where: { eventId: cleanupEventId },
          }),
        ]);

        await Promise.all([
          data.dates && data.dates.length > 0
            ? tx.cleanupEventDate.createMany({
                data: data.dates.map((dateDto) => ({
                  eventId: cleanupEventId,
                  date: dateDto.date,
                })),
              })
            : Promise.resolve(),
          data.equipments && data.equipments.length > 0
            ? tx.cleanupEquipment.createMany({
                data: data.equipments.map((equipmentDto) => ({
                  eventId: cleanupEventId,
                  ...equipmentDto,
                })),
              })
            : Promise.resolve(),
        ]);

        return updatedCleanupEvent;
      });

      await this.redisService.delete('cleanup-events:*');
      await this.redisService.delete(`cleanup-event:${cleanupEventId}`);

      return updatedEvent as CleanupEvent;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update cleanup event');
    }
  }

  async getCleanupEvents(query: GetCleanupEventsQueryDto) {
    try {
      const skip = (query.page - 1) * query.pageSize;
      const whereClause = this.buildGetCleanupEventsWhereClause(query);
      const orderByClause = this.buildGetCleanupEventOrderByClause(query);

      const [cleanupEvents, total] = await Promise.all([
        this.prisma.cleanupEvent.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: query.pageSize,
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            imageUrl: true,
            settlement: {
              select: {
                id: true,
                name: true,
                longitude: true,
                latitude: true,
                region: true,
              },
            },
            organizer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.cleanupEvent.count({ where: whereClause }),
      ]);

      return { cleanupEvents, total };
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async isPointInSettlement(
    data: UpsertCleanupEventLocationDto,
    settlementId: string,
  ) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement) {
      throw new NotFoundException(
        `Settlement with id ${settlementId} not found.`,
      );
    }

    const params = {
      format: 'jsonv2',
      lat: data.latitude.toString(),
      lon: data.longitude.toString(),
      'accept-language': 'uk',
    };

    try {
      const response = await axios.get<NominatimResponse>(this.nominatimUrl, {
        params,
      });
      const addr = response.data.address;
      if (!addr) return false;

      const city = addr.city ?? addr.town ?? addr.village;
      if (!city) return false;

      return city.trim().toLowerCase() === settlement.name.trim().toLowerCase();
    } catch (error: unknown) {
      if (error instanceof HttpException) throw error;

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Nominatim error: ${errorMessage}`);
      throw new InternalServerErrorException(
        'Error while requesting Nominatim',
      );
    }
  }

  private buildGetCleanupEventsWhereClause(
    filters: GetCleanupEventsQueryDto,
  ): Prisma.CleanupEventWhereInput {
    const where: Prisma.CleanupEventWhereInput = {};

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.status) where.status = filters.status;

    if (filters.settlementId) where.settlementId = filters.settlementId;

    if (filters.startDate) where.startDate = { gte: filters.startDate };

    if (filters.endDate) where.endDate = { lte: filters.endDate };

    if (filters.regionId) {
      where.settlement = { region: { id: filters.regionId } };
    }

    return where;
  }

  private buildGetCleanupEventOrderByClause(
    filters: GetCleanupEventsQueryDto,
  ): Prisma.CleanupEventOrderByWithRelationInput {
    switch (filters.sortBy) {
      case SortBy.NAME:
        return { name: filters.sortOrder || 'asc' };
      case SortBy.START_DATE:
        return { startDate: filters.sortOrder || 'asc' };
      case SortBy.END_DATE:
        return { endDate: filters.sortOrder || 'asc' };
      default:
        return {};
    }
  }
}
