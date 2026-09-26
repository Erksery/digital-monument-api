import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateFreeProfileDto } from '../dto/create-free-profile.dto';
import { profile_visibility_type } from '../../generated/prisma/client';

@Injectable()
export class CreateFreeProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFreeProfileDto, userId: string) {
    if (!userId) {
      throw new ForbiddenException('Отсутствует uuid пользователя');
    }

    return this.prisma.profiles.create({
      data: {
        userId,

        fullName: data.fullName,

        birthDate: new Date(data.birthDate),
        deathDate: data.deathDate ? new Date(data.deathDate) : null,

        contentMarkdown: '',

        children: [],
        awards: [],
        photoGallery: [],

        visibilitySettings: {
          create: {
            visibility: profile_visibility_type.public,
          },
        },
      },
    });
  }
}
