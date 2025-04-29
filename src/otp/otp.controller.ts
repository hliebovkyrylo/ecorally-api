import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OtpService } from './otp.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Create OTP',
    description:
      'Creates a one time password (OTP) for the user and sends it via email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Otp was successfully generated and sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message text' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Access token not provided or has expired',
  })
  @ApiResponse({
    status: 400,
    description: 'Access token is not valid',
  })
  async sendOtp(@Req() req) {
    const user = req.user;
    return this.otpService.generateAndSendOtp(user);
  }
}
