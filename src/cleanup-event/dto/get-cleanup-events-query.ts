import { EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsDateAfter } from '../../common/decorators';
import {
  SortBy,
  SortOrder,
} from '../enum/get-cleanup-events-sort-options.enum';

export class GetCleanupEventsQueryDto {
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsUUID()
  settlementId?: string;

  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  // eslint-disable-next-line
  @ValidateIf((o) => o.startDate && o.endDate)
  @IsDateAfter('startDate')
  endDate?: Date;

  @IsOptional()
  @IsString()
  status?: EventStatus;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pageSize: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
