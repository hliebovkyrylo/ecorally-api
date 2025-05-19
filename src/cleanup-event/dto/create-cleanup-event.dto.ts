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
import { CreateCleanupEventDateDto } from './create-cleanup-event-dates.dto';
import { Type } from 'class-transformer';
import { CreateCleanupEquipmentDto } from './create-cleanup-equipment.dto';
import { CreateCleanupEventLocationDto } from './create-cleanup-event-location.dto';

export class CreateCleanupEventDto {
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
  @Type(() => CreateCleanupEventDateDto)
  dates: CreateCleanupEventDateDto[];

  @IsUrl()
  imageUrl: string;

  @IsUUID()
  settlementId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCleanupEquipmentDto)
  equipments: CreateCleanupEquipmentDto[];

  @ValidateNested()
  @Type(() => CreateCleanupEventLocationDto)
  location: CreateCleanupEventLocationDto;
}
