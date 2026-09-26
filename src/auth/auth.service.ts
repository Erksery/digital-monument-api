import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { RegisterDto } from './dto/register-user.dto';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';
import { LoginDto } from './dto/login-user.dto';
import { TokensService } from './tokens.service';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly tokensServise: TokensService,
    private readonly otpService: OtpService,
  ) {}

  async register(data: RegisterDto) {
    const existsUser = await this.usersService.findByLoginOrEmail(
      data.login,
      data.email,
    );

    if (existsUser) {
      if (existsUser.login === data.login) {
        throw new ConflictException('Этот логин уже занят');
      }
      if (existsUser.email === data.email) {
        throw new ConflictException('Этот email уже занят');
      }
      throw new ConflictException('Пользователь уже существует');
    }

    const user = await this.usersService.create(data);

    const code = await this.otpService.create(user.id, 'email_verification');

    // Временно
    console.log(`OTP для ${user.email}: ${code}`);

    return {
      success: true,
      message: 'Пользователь зарегистрирован',
      userId: user.id,
    };
  }

  async login(data: LoginDto) {
    const user = await this.usersService.findByLoginOrEmailWithPassword(
      data.identifier,
      data.identifier,
    );

    if (!user) {
      throw new UnauthorizedException('Ошибка при авторизации');
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный пароль');
    }

    if (!user.is_verified) {
      throw new UnauthorizedException('Email не подтверждён');
    }

    const tokens = await this.tokensServise.generateTokens({
      id: user.id,
      login: user.login,
      role: user.role as string,
    });

    await this.tokensServise.saveRefreshToken(user.id, tokens.refreshToken);

    const { password: _, ...safeUser } = user;

    return { tokens, user: safeUser };
  }

  async logout(token: string) {
    await this.tokensServise.removeRefreshToken(token);

    return { success: true };
  }

  async refresh(oldRefreshToken: string, userId: string) {
    await this.tokensServise.removeRefreshToken(oldRefreshToken);

    const user = await this.usersService.findById(userId);

    const tokens = await this.tokensServise.generateTokens({
      id: user.id,
      login: user.login,
      role: user.role as string,
    });

    await this.tokensServise.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async verifyOtp(userId: string, code: string) {
    await this.otpService.verify(userId, code, 'email_verification');

    await this.usersService.verifyEmail(userId);

    return {
      success: true,
      message: 'Email успешно подтверждён',
    };
  }

  async resendOtp(userId: string) {
    const user = await this.usersService.findById(userId);

    if (user.is_verified) {
      throw new ConflictException('Email уже подтверждён');
    }

    const code = await this.otpService.resend(userId, 'email_verification');

    // Пока вместо отправки email
    console.log(`Новый OTP для ${user.email}: ${code}`);

    return {
      success: true,
      message: 'Новый код подтверждения отправлен',
    };
  }
}
