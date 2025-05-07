import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { Request, Response } from 'express';
import { SignInDto } from './dto/sign-in.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiOperation({
    summary: 'Sign up a new user',
    description:
      'Creates a new user account and returns an access token. A refresh token is set as an HTTP-only cookie.',
  })
  @ApiBody({ type: SignUpDto, description: 'User sign-up data' })
  @ApiResponse({
    status: 200,
    description: 'User successfully signed up',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
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
  @ApiOperation({
    summary: 'Sign in a user',
    description:
      'Authenticates a user and returns an access token. A refresh token is set as an HTTP-only cookie.',
  })
  @ApiBody({ type: SignInDto, description: 'User sign-in credentials' })
  @ApiResponse({
    status: 200,
    description: 'User successfully signed in',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', description: 'JWT access token' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async signIn(@Body() data: SignInDto, @Res() res: Response) {
    const result = await this.authService.signIn(data);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.send({ accessToken: result.accessToken });
  }

  @Post('refresh-token')
  async refreshToken(@Res() res: Response, @Req() req: Request) {
    const accessToken = req.headers['authorization'];
    const refreshToken = req.cookies.refreshToken as string | undefined;
    const result = await this.authService.refreshToken(
      accessToken,
      refreshToken,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.send({
      accessToken: result.accessToken,
    });
  }
}
