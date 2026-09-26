import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CheckAccessService } from './check-access.service';
import { UpdatePremiumProfileDto } from '../dto/update-premium-profile.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class UpdatePremiumProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: CheckAccessService,
  ) {}

  async update(id: string, data: UpdatePremiumProfileDto, userId: string) {
    const profile = await this.accessService.checkAccess(id, userId, false);

    const isOwner = profile.userId === userId;

    const {
      visibility,
      editorUserIds,
      birthDate,
      deathDate,
      burialCoordinates,
      ...profileData
    } = data;
    if ((visibility !== undefined || editorUserIds !== undefined) && !isOwner) {
      throw new ForbiddenException(
        'Только владелец может изменять настройки доступа профиля',
      );
    }
    const updateData: Prisma.profilesUpdateInput = {
      ...profileData,

      ...(birthDate !== undefined && {
        birthDate: new Date(birthDate),
      }),

      ...(deathDate !== undefined && {
        deathDate: new Date(deathDate),
      }),

      ...(burialCoordinates !== undefined && {
        burialCoordinates:
          burialCoordinates as unknown as Prisma.InputJsonValue,
      }),
    };
    if (visibility !== undefined) {
      updateData.visibilitySettings = {
        upsert: {
          create: {
            visibility: visibility.type,

            allowedUsers: {
              create:
                visibility.type === 'selected'
                  ? (visibility.allowedUserIds ?? []).map((allowedUserId) => ({
                      userId: allowedUserId,
                    }))
                  : [],
            },
          },

          update: {
            visibility: visibility.type,

            allowedUsers: {
              deleteMany: {},

              create:
                visibility.type === 'selected'
                  ? (visibility.allowedUserIds ?? []).map((allowedUserId) => ({
                      userId: allowedUserId,
                    }))
                  : [],
            },
          },
        },
      };
    }
    if (editorUserIds !== undefined) {
      updateData.editors = {
        deleteMany: {},

        create: editorUserIds.map((editorId) => ({
          userId: editorId,
        })),
      };
    }

    return this.prisma.profiles.update({
      where: {
        id,
      },
      data: updateData,
    });
  }
}
