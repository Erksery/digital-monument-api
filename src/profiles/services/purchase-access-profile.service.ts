import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PurchaseAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async releasePremiumPurchase(
    userId: string,
    profileId: string,
    tx: Prisma.TransactionClient,
  ) {
    await tx.profile_purchases.updateMany({
      where: {
        userId,
        profileId,
        type: 'premium',
        status: 'paid',
        activatedAt: {
          not: null,
        },
      },
      data: {
        profileId: null,
        activatedAt: null,
      },
    });
  }

  async reservePremiumPurchase(
    userId: string,
    profileId: string,
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.profile_purchases.updateMany({
      where: {
        userId,
        type: 'premium',
        status: 'paid',
        activatedAt: null,
        profileId: null,
      },
      data: {
        profileId,
        activatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new ForbiddenException(
        'Для создания премиум-профиля требуется оплата.',
      );
    }
  }
}
