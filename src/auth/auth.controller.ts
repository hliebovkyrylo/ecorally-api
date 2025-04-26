import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Response } from 'express';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() data: SignUpDto, @Res() res: Response) {
    const result = await this.authService.signUp(data);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.send({ accessToken: result.accessToken });
  }

  @Post('sign-in')
  async signIn(@Body() data: SignInDto, @Res() res: Response) {
    const result = await this.authService.signIn(data);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.send({ accessToken: result.accessToken });
  }
}
