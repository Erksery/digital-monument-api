import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  CreatePremiumProfileDto,
  VisibilityDto,
} from '../dto/create-premium-profile.dto';
import { PrismaService } from '../../prisma.service';
import { Prisma, profile_visibility_type } from '../../generated/prisma/client';
import { PurchaseAccessService } from './purchase-access-profile.service';

@Injectable()
export class CreatePremiumProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchaseService: PurchaseAccessService,
  ) {}

  private buildVisibilityData(visibility: VisibilityDto) {
    return {
      visibility: visibility.type,

      allowedUsers: {
        create:
          visibility.type === profile_visibility_type.selected
            ? (visibility.allowedUserIds ?? []).map((userId) => ({
                user: {
                  connect: { id: userId },
                },
              }))
            : [],
      },
    };
  }

  private buildEditorsData(editorUserIds?: string[]) {
    return (editorUserIds ?? []).map((userId) => ({
      user: {
        connect: { id: userId },
      },
    }));
  }

  async create(data: CreatePremiumProfileDto, userId: string) {
    if (!userId) {
      throw new ForbiddenException('Отсутствует uuid пользователя');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const {
        visibility,
        editorUserIds,
        birthDate: _birthDate,
        deathDate: _deathDate,
        burialCoordinates: _burialCoordinates,
        ...profileData
      } = data;

      const profile = await tx.profiles.create({
        data: {
          ...profileData,

          userId,
          is_premium: true,

          birthDate: new Date(data.birthDate),
          deathDate: new Date(data.deathDate),

          burialCoordinates: data.burialCoordinates as
            | Prisma.InputJsonValue
            | undefined,

          visibilitySettings: {
            create: this.buildVisibilityData(visibility),
          },

          editors: {
            create: this.buildEditorsData(editorUserIds),
          },
        },
      });

      await this.purchaseService.reservePremiumPurchase(userId, profile.id, tx);

      return profile;
    });
  }
}
