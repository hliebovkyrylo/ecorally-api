import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCleanupEventDto } from './dto/create-cleanup-event.dto';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { CreateCleanupEventLocationDto } from './dto/create-cleanup-event-location.dto';
import { NominatimResponse } from './types/nominatim-response';

@Injectable()
export class CleanupEventService {
  private readonly nominatimUrl: string;
  private readonly logger = new Logger(CleanupEventService.name);

  constructor(private readonly prisma: PrismaService) {
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

  async createCleanupEvent(data: CreateCleanupEventDto, userId: string) {
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

  private async isPointInSettlement(
    data: CreateCleanupEventLocationDto,
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
}
