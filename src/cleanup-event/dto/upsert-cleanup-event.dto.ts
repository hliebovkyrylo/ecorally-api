import { type EventStatus } from '@prisma/client';
import {
  IsArray,
  IsDate,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UpsertCleanupEventDateDto } from './upsert-cleanup-event-dates.dto';
import { Type } from 'class-transformer';
import { UpsertCleanupEquipmentDto } from './upsert-cleanup-equipment.dto';
import { UpsertCleanupEventLocationDto } from './upsert-cleanup-event-location.dto';

export class UpsertCleanupEventDto {
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(500)
  description: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsString()
  status: EventStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertCleanupEventDateDto)
  dates: UpsertCleanupEventDateDto[];

  @IsUrl()
  imageUrl: string;

  @IsUUID()
  settlementId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertCleanupEquipmentDto)
  equipments: UpsertCleanupEquipmentDto[];

  @ValidateNested()
  @Type(() => UpsertCleanupEventLocationDto)
  location: UpsertCleanupEventLocationDto;
}
