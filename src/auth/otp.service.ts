import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { otp_type } from '../generated/prisma/client';

@Injectable()
export class OtpService {
  private readonly OTP_TTL = 5 * 60 * 1000;
  private readonly MAX_ATTEMPTS = 5;

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, type: otp_type) {
    await this.prisma.otp_code.deleteMany({
      where: {
        userId,
        type,
      },
    });

    const code = randomInt(100000, 1000000).toString();

    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.otp_code.create({
      data: {
        userId,
        codeHash,
        type,
        expiresAt: new Date(Date.now() + this.OTP_TTL),
      },
    });

    return code;
  }

  async verify(userId: string, code: string, type: otp_type) {
    const otp = await this.prisma.otp_code.findFirst({
      where: {
        userId,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      throw new BadRequestException('Код подтверждения не найден');
    }

    if (otp.expiresAt < new Date()) {
      await this.prisma.otp_code.delete({
        where: {
          id: otp.id,
        },
      });

      throw new BadRequestException('Срок действия кода истёк');
    }

    if (otp.attempts >= this.MAX_ATTEMPTS) {
      await this.prisma.otp_code.delete({
        where: {
          id: otp.id,
        },
      });

      throw new BadRequestException('Превышено количество попыток');
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);

    if (!isValid) {
      await this.prisma.otp_code.update({
        where: {
          id: otp.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException('Неверный код подтверждения');
    }

    await this.prisma.otp_code.delete({
      where: {
        id: otp.id,
      },
    });

    return true;
  }

  async resend(userId: string, type: otp_type) {
    const existingOtp = await this.prisma.otp_code.findFirst({
      where: {
        userId,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingOtp) {
      const cooldown = 60 * 1000;
      const elapsed = Date.now() - existingOtp.createdAt.getTime();

      if (elapsed < cooldown) {
        const remainingSeconds = Math.ceil((cooldown - elapsed) / 1000);

        throw new BadRequestException(
          `Повторно отправить код можно через ${remainingSeconds} сек.`,
        );
      }
    }

    return this.create(userId, type);
  }
}
