import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class CheckOtpDto {
  @ApiProperty({
    description: 'Code that was sent to email',
    example: 111111,
  })
  @IsNumber({}, { message: 'Code must be a number' })
  @Min(100000, { message: 'Code must be a 6-digit number' })
  @Max(999999, { message: 'Code must be a 6-digit number' })
  code: number;
}
