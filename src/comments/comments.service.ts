import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentStatusDto } from './dto/update-comment.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentDto, userId: string) {
    if (!userId) {
      throw new ForbiddenException('Отсутствует uuid пользователя');
    }

    const profile = await this.prisma.profiles.findUnique({
      where: { id: data.profileId },
    });

    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    return this.prisma.profile_comments.create({
      data: { ...data, userId: userId },
    });
  }

  async findAllWithProfile(profileId: string) {
    if (!profileId) {
      throw new ForbiddenException('Отсутствует id профиля');
    }

    return this.prisma.profile_comments.findMany({
      where: {
        profileId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllForProfileOwner(profileId: string, userId: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: {
        id: profileId,
      },
      select: {
        userId: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException(
        'Только создатель профиля может просматривать неодобренные комментарии',
      );
    }

    return this.prisma.profile_comments.findMany({
      where: {
        profileId,
        isApproved: false,
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAllWithUser(userId: string) {
    if (!userId) {
      throw new ForbiddenException('Отсутствует uuid пользователя');
    }
    return this.prisma.profile_comments.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const comment = await this.prisma.profile_comments.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Комментарий с ID ${id} не найден`);
    }

    return comment;
  }

  async update(
    data: UpdateCommentStatusDto,
    commentId: string,
    userId: string,
  ) {
    if (!userId) {
      throw new ForbiddenException('Отсутствует uuid пользователя');
    }

    const comment = await this.findOne(commentId);

    const profile = await this.prisma.profiles.findUnique({
      where: { id: comment.profileId },
    });

    if (!profile || profile.userId !== userId) {
      throw new ForbiddenException(
        'Только создатель профиля может одобрить или скрыть этот комментарий',
      );
    }

    return this.prisma.profile_comments.update({
      where: { id: commentId },
      data: { isApproved: data.isApproved },
    });
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.findOne(commentId);

    const profile = await this.prisma.profiles.findUnique({
      where: { id: comment.profileId },
    });

    const isCommentAuthor = comment.userId === userId;
    const isProfileOwner = profile?.userId === userId;

    if (!isCommentAuthor && !isProfileOwner) {
      throw new ForbiddenException(
        'У вас нет прав для удаления данного комментария',
      );
    }

    return this.prisma.profile_comments.delete({ where: { id: commentId } });
  }
}
