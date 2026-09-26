import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CheckAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAccess(profileId: string, userId: string, requireOwner = false) {
    const profile = await this.prisma.profiles.findUnique({
      where: {
        id: profileId,
      },
      select: {
        id: true,
        userId: true,

        editors: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Профиль с ID ${profileId} не найден`);
    }

    const isOwner = profile.userId === userId;

    if (requireOwner) {
      if (!isOwner) {
        throw new ForbiddenException(
          'У вас нет прав владельца для этого профиля',
        );
      }

      return profile;
    }

    const isEditor = profile.editors.some((editor) => editor.userId === userId);

    if (!isOwner && !isEditor) {
      throw new ForbiddenException(
        'У вас нет прав для редактирования этого профиля',
      );
    }

    return profile;
  }
}
