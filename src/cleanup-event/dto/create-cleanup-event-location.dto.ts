import { IsNumber } from 'class-validator';

export class CreateCleanupEventLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
