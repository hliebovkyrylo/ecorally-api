import {
  IsEmail,
  IsNumber,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Match } from '../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Code that user received on email',
    example: '123456',
  })
  @IsNumber()
  @Min(100000, { message: 'Password must be a 6-digit number' })
  @Max(999999, { message: 'Password must be a 6-digit number' })
  code: number;

  @ApiProperty({
    description: 'New user password',
    example: '123456password',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Confirm new user password',
    example: '123456password',
  })
  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
