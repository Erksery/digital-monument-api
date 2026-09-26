import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { FindAllProfilesDto } from '../dto/find-all-profile.dto';
import { Prisma, profile_visibility_type } from '../../generated/prisma/client';
import { IStorageService } from '../../storage/storage.interface';
import { STORAGE_TOKEN } from '../../storage/storage.module';

type ProfileAccessData = Prisma.profilesGetPayload<{
  select: {
    id: true;
    userId: true;
    visibilitySettings: {
      select: {
        visibility: true;
        allowedUsers: {
          select: {
            userId: true;
          };
        };
      };
    };
    editors: {
      select: {
        userId: true;
      };
    };
  };
}>;

type PublicProfile = Prisma.profilesGetPayload<{
  select: {
    id: true;
    userId: true;
    avatar: true;
    fullName: true;
    birthDate: true;
    deathDate: true;
    quote: true;
    quoteAuthor: true;
    birthPlace: true;
    deathPlace: true;
    spouse: true;
    children: true;
    citizenship: true;
    education: true;
    occupation: true;
    awards: true;
    contentMarkdown: true;
    photoGallery: true;
    burialAddress: true;
    burialCoordinates: true;
    createdAt: true;
    updatedAt: true;
    is_premium: true;
  };
}>;

@Injectable()
export class FindProfileService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_TOKEN)
    private readonly storageService: IStorageService,
  ) {}

  private readonly accessSelect = {
    id: true,
    userId: true,

    visibilitySettings: {
      select: {
        visibility: true,

        allowedUsers: {
          select: {
            userId: true,
          },
        },
      },
    },

    editors: {
      select: {
        userId: true,
      },
    },
  } satisfies Prisma.profilesSelect;

  private readonly publicSelect = {
    id: true,
    userId: true,
    avatar: true,
    fullName: true,
    birthDate: true,
    deathDate: true,
    quote: true,
    quoteAuthor: true,
    birthPlace: true,
    deathPlace: true,
    spouse: true,
    children: true,
    citizenship: true,
    education: true,
    occupation: true,
    awards: true,
    contentMarkdown: true,
    photoGallery: true,
    burialAddress: true,
    burialCoordinates: true,
    createdAt: true,
    updatedAt: true,
    is_premium: true,
  } satisfies Prisma.profilesSelect;

  private canViewProfile(
    profile: ProfileAccessData,
    currentUserId?: string,
  ): boolean {
    if (profile.userId === currentUserId) {
      return true;
    }

    const isEditor = profile.editors.some(
      (editor) => editor.userId === currentUserId,
    );

    if (isEditor) {
      return true;
    }

    const settings = profile.visibilitySettings;

    if (!settings) {
      return true;
    }

    switch (settings.visibility) {
      case profile_visibility_type.public:
        return true;

      case profile_visibility_type.private:
        return false;

      case profile_visibility_type.selected:
        return settings.allowedUsers.some(
          (user) => user.userId === currentUserId,
        );

      default:
        return false;
    }
  }

  private formatPublicProfileResponse(profile: PublicProfile) {
    return {
      ...profile,

      avatar: profile.avatar
        ? this.storageService.getFileUrl(profile.avatar)
        : null,

      photoGallery: (profile.photoGallery ?? []).map((path) =>
        this.storageService.getFileUrl(path),
      ),
    };
  }

  private async findProfileAccessData(
    profileId: string,
  ): Promise<ProfileAccessData> {
    const profile = await this.prisma.profiles.findUnique({
      where: {
        id: profileId,
      },
      select: this.accessSelect,
    });

    if (!profile) {
      throw new NotFoundException(`Профиль с ID ${profileId} не найден`);
    }

    return profile;
  }

  private async ensureCanView(
    profileId: string,
    currentUserId?: string,
  ): Promise<void> {
    const profile = await this.findProfileAccessData(profileId);

    if (!this.canViewProfile(profile, currentUserId)) {
      throw new ForbiddenException('У вас нет доступа к этому профилю');
    }
  }

  async findAll(params: FindAllProfilesDto, currentUserId?: string) {
    const {
      limit = 50,
      page = 0,
      sortBy,
      sortOrder,
      fullName,
      birthDate,
      deathDate,
      userId,
    } = params;

    const accessConditions: Prisma.profilesWhereInput[] = [
      {
        OR: [
          {
            visibilitySettings: {
              is: null,
            },
          },
          {
            visibilitySettings: {
              is: {
                visibility: profile_visibility_type.public,
              },
            },
          },
        ],
      },
    ];

    if (currentUserId) {
      accessConditions.push({
        OR: [
          {
            userId: currentUserId,
          },
          {
            editors: {
              some: {
                userId: currentUserId,
              },
            },
          },
          {
            visibilitySettings: {
              is: {
                visibility: profile_visibility_type.selected,
                allowedUsers: {
                  some: {
                    userId: currentUserId,
                  },
                },
              },
            },
          },
        ],
      });
    }

    const filters: Prisma.profilesWhereInput[] = [];

    if (fullName) {
      filters.push({
        fullName: {
          contains: fullName,
          mode: 'insensitive',
        },
      });
    }

    if (birthDate) {
      filters.push({
        birthDate: new Date(birthDate),
      });
    }

    if (deathDate) {
      filters.push({
        deathDate: new Date(deathDate),
      });
    }

    if (userId) {
      filters.push({
        userId,
      });
    }

    const where: Prisma.profilesWhereInput = {
      AND: [...accessConditions, ...filters],
    };

    const takeValue = Math.max(1, Number(limit));
    const skipValue = Math.max(0, Number(page)) * takeValue;

    const profiles = await this.prisma.profiles.findMany({
      where,
      take: takeValue,
      skip: skipValue,

      orderBy: sortBy
        ? {
            [sortBy]: sortOrder ?? 'asc',
          }
        : {
            createdAt: 'desc',
          },

      select: this.publicSelect,
    });

    return profiles.map((profile) => this.formatPublicProfileResponse(profile));
  }

  async findOne(id: string, userId?: string) {
    await this.ensureCanView(id, userId);

    const profile = await this.prisma.profiles.findUnique({
      where: {
        id,
      },
      select: this.publicSelect,
    });

    if (!profile) {
      throw new NotFoundException(`Профиль с ID ${id} не найден`);
    }

    return this.formatPublicProfileResponse(profile);
  }

  async findOneForManagement(id: string, userId: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: {
        id,
      },
      include: {
        visibilitySettings: {
          include: {
            allowedUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    login: true,
                  },
                },
              },
            },
          },
        },

        editors: {
          include: {
            user: {
              select: {
                id: true,
                login: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Профиль с ID ${id} не найден`);
    }

    const isOwner = profile.userId === userId;

    const isEditor = profile.editors.some((editor) => editor.userId === userId);

    if (!isOwner && !isEditor) {
      throw new ForbiddenException(
        'У вас нет прав для просмотра настроек этого профиля',
      );
    }

    return {
      id: profile.id,
      userId: profile.userId,
      avatar: profile.avatar
        ? this.storageService.getFileUrl(profile.avatar)
        : null,
      fullName: profile.fullName,
      birthDate: profile.birthDate,
      deathDate: profile.deathDate,
      quote: profile.quote,
      quoteAuthor: profile.quoteAuthor,
      birthPlace: profile.birthPlace,
      deathPlace: profile.deathPlace,
      spouse: profile.spouse,
      children: profile.children,
      citizenship: profile.citizenship,
      education: profile.education,
      occupation: profile.occupation,
      awards: profile.awards,
      contentMarkdown: profile.contentMarkdown,

      photoGallery: (profile.photoGallery ?? []).map((path) =>
        this.storageService.getFileUrl(path),
      ),

      burialAddress: profile.burialAddress,
      burialCoordinates: profile.burialCoordinates,

      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      is_premium: profile.is_premium,

      editors: profile.editors.map((editor) => ({
        userId: editor.userId,
        login: editor.user.login,
      })),

      visibilitySettings: profile.visibilitySettings
        ? {
            id: profile.visibilitySettings.id,
            visibility: profile.visibilitySettings.visibility,

            allowedUsers: profile.visibilitySettings.allowedUsers.map(
              (allowedUser) => ({
                userId: allowedUser.userId,
                login: allowedUser.user.login,
              }),
            ),
          }
        : null,
    };
  }
}
