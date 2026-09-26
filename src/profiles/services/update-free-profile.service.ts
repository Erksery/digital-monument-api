import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateFreeProfileDto } from '../dto/update-free-profile.dto';
import { CheckAccessService } from './check-access.service';

@Injectable()
export class UpdateFreeProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessService: CheckAccessService,
  ) {}

  async update(id: string, data: UpdateFreeProfileDto, userId: string) {
    await this.accessService.checkAccess(id, userId, false);

    const { fullName, birthDate, deathDate } = data;

    return this.prisma.profiles.update({
      where: {
        id,
      },

      data: {
        ...(fullName !== undefined && {
          fullName,
        }),

        ...(birthDate !== undefined && {
          birthDate: new Date(birthDate),
        }),

        ...(deathDate !== undefined && {
          deathDate: new Date(deathDate),
        }),
      },
    });
  }
}
