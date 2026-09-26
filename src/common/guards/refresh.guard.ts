import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from '../../auth/tokens.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  id: string;
  login: string;
  role: string;
}

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private tokensService: TokensService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request.cookies?.['refreshToken'];

    if (!token) {
      throw new UnauthorizedException('Refresh токен не найден в cookie');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (err) {
      throw new UnauthorizedException(
        'Невалидный или просроченный refresh токен',
      );
    }

    const tokenInDb = await this.tokensService.findRefreshToken(token);

    if (!tokenInDb) {
      throw new UnauthorizedException('Сессия завершена или токен отозван');
    }

    if (tokenInDb.userId !== payload.id) {
      throw new UnauthorizedException('Неверная сессия');
    }

    request['user'] = payload;
    request['refreshToken'] = token;
    return true;
  }
}
