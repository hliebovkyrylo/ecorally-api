import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class UpsertCleanupEventDateDto {
  @IsDate()
  @Type(() => Date)
  date: Date;
}
