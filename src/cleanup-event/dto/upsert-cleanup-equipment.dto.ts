import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpsertCleanupEquipmentDto {
  @IsUUID()
  equipmentId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
