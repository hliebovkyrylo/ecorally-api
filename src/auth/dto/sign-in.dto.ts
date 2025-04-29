import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'User email address',
    example: 'example@example.ex',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password of account', example: '1234567890' })
  @MinLength(8)
  password: string;
}
