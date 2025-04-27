import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OtpService } from './otp.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @UseGuards(AuthGuard)
  async sendOtp(@Req() req) {
    const user = req.user;
    return this.otpService.generateAndSendOtp(user);
  }
}
