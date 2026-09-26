import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service.js';
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async generateTokens(payload: { id: string; login: string; role: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
      this.jwtService.signAsync(
        {
          id: payload.id,
        },
        {
          expiresIn: '7d',
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async saveRefreshToken(userId: string, token: string) {
    return this.prisma.tokens.create({
      data: {
        token: this.hashToken(token),
        userId,
      },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.tokens.findUnique({
      where: { token: this.hashToken(token) },
    });
  }

  async removeRefreshToken(token: string) {
    return this.prisma.tokens.deleteMany({
      where: { token: this.hashToken(token) },
    });
  }
}
