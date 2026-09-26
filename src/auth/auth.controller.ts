import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { Response } from 'express';
import { RefreshGuard } from '../common/guards/refresh.guard';
import { RefreshToken } from '../common/decorators/extract-token.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  @Post('register')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(body);

    res.cookie('accessToken', tokens.accessToken, {
      ...this.cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...this.cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return user;
  }

  @Post('logout')
  @UseGuards(RefreshGuard)
  async logout(
    @RefreshToken() token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(token);

    res.clearCookie('accessToken', this.cookieOptions);
    res.clearCookie('refreshToken', this.cookieOptions);

    return { message: 'Вы успешно вышли из системы' };
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  async refresh(
    @RefreshToken() token: string,
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refresh(token, user.id);

    res.cookie('accessToken', tokens.accessToken, {
      ...this.cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      ...this.cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Токены обновлены' };
  }

  @Post('verify-otp')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.userId, body.code);
  }

  @Post('resend-otp')
  @Throttle({
    default: {
      limit: 3,
      ttl: 60_000,
    },
  })
  async resendOtp(@Body() body: ResendOtpDto) {
    return this.authService.resendOtp(body.userId);
  }
}
