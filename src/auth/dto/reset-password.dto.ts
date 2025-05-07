import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNumber()
  @Min(100000, { message: 'Password must be a 6-digit number' })
  @Max(999999, { message: 'Password must be a 6-digit number' })
  code: number;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  confirmPassword: string;
}
