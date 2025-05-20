import { IsNumber } from 'class-validator';

export class UpsertCleanupEventLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
