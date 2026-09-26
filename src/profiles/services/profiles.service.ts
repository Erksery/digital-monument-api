import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IStorageService } from '../../storage/storage.interface';
import { STORAGE_TOKEN } from '../../storage/storage.module';
import { CheckAccessService } from './check-access.service';
import { PrismaService } from '../../prisma.service';
import { PurchaseAccessService } from './purchase-access-profile.service';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: CheckAccessService,
    private readonly purchaseAccessService: PurchaseAccessService,
    @Inject(STORAGE_TOKEN)
    private readonly storageService: IStorageService,
  ) {}

  async remove(id: string, userId: string) {
    await this.accessService.checkAccess(id, userId, true);

    const profile = await this.prisma.profiles.findUnique({
      where: {
        id,
      },
      select: {
        avatar: true,
        photoGallery: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    const deletedProfile = await this.prisma.$transaction(async (tx) => {
      await this.purchaseAccessService.releasePremiumPurchase(userId, id, tx);

      return tx.profiles.delete({
        where: {
          id,
        },
      });
    });

    if (profile.avatar) {
      try {
        await this.storageService.deleteFile(profile.avatar);
      } catch (error) {
        this.logger.error(
          `Ошибка удаления аватара: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    for (const photoPath of profile.photoGallery ?? []) {
      try {
        await this.storageService.deleteFile(photoPath);
      } catch (error) {
        this.logger.error(
          `Ошибка удаления фото галереи: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return deletedProfile;
  }

  async uploadMedia(
    file: Express.Multer.File,
    profileId: string,
    userId: string,
  ) {
    if (!profileId) {
      throw new ForbiddenException('Не указан profileId для загрузки файла');
    }

    await this.accessService.checkAccess(profileId, userId, false);

    const profile = await this.prisma.profiles.findUnique({
      where: {
        id: profileId,
      },
      select: {
        avatar: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    const fileUrlPath = await this.storageService.uploadFile(
      file,
      'profiles-media',
    );

    try {
      await this.prisma.profiles.update({
        where: {
          id: profileId,
        },
        data: {
          avatar: fileUrlPath,
        },
      });
    } catch (error) {
      try {
        await this.storageService.deleteFile(fileUrlPath);
      } catch (cleanupError) {
        this.logger.error(
          `Ошибка очистки нового аватара: ${
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError)
          }`,
        );
      }

      throw error;
    }

    if (profile.avatar && profile.avatar !== fileUrlPath) {
      try {
        await this.storageService.deleteFile(profile.avatar);
      } catch (error) {
        this.logger.error(
          `Ошибка удаления старого аватара: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return {
      url: this.storageService.getFileUrl(fileUrlPath),
    };
  }

  async uploadGallery(
    files: Express.Multer.File[],
    profileId: string,
    userId: string,
  ) {
    if (!profileId) {
      throw new ForbiddenException('Не указан profileId для загрузки файлов');
    }

    if (!files || files.length === 0) {
      return [];
    }

    await this.accessService.checkAccess(profileId, userId, false);

    const filePaths = await this.storageService.uploadFiles(files, 'gallery');

    try {
      const updatedProfile = await this.prisma.profiles.update({
        where: {
          id: profileId,
        },
        data: {
          photoGallery: {
            push: filePaths,
          },
        },
      });

      return updatedProfile.photoGallery.map((path) =>
        this.storageService.getFileUrl(path),
      );
    } catch (error) {
      for (const filePath of filePaths) {
        try {
          await this.storageService.deleteFile(filePath);
        } catch (cleanupError) {
          this.logger.error(
            `Ошибка очистки загруженного файла: ${
              cleanupError instanceof Error
                ? cleanupError.message
                : String(cleanupError)
            }`,
          );
        }
      }

      throw error;
    }
  }
}
