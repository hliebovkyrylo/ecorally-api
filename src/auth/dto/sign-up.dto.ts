import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../common/decorators';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'example@example.ex',
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password of account', example: '1234567890' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Confirm password of account',
    example: '1234567890',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
