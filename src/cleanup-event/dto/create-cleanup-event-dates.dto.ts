import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class CreateCleanupEventDateDto {
  @IsDate()
  @Type(() => Date)
  date: Date;
}
