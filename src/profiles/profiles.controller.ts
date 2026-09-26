import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProfilesService } from './services/profiles.service';

import { AccessGuard } from '../common/guards/access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FindAllProfilesDto } from './dto/find-all-profile.dto';
import { OptionalAccessGuard } from '../common/guards/optional.access.guard';

import { FindProfileService } from './services/find-profile.service';
import { CreateFreeProfileDto } from './dto/create-free-profile.dto';
import { CreateFreeProfileService } from './services/create-free-profile.service';
import { CreatePremiumProfileService } from './services/create-premium-profile.service';
import { CreatePremiumProfileDto } from './dto/create-premium-profile.dto';
import { UpdatePremiumProfileDto } from './dto/update-premium-profile.dto';
import { UpdatePremiumProfileService } from './services/update-premium-profile.service';
import { UpdateFreeProfileService } from './services/update-free-profile.service';
import { UpdateFreeProfileDto } from './dto/update-free-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly findProfileService: FindProfileService,
    private readonly createFreeProfileService: CreateFreeProfileService,
    private readonly createPremiumProfileService: CreatePremiumProfileService,
    private readonly updateFreeProfileService: UpdateFreeProfileService,
    private readonly updatePremiumProfileService: UpdatePremiumProfileService,
  ) {}

  @Post('premium')
  @UseGuards(AccessGuard)
  createPremium(
    @Body() body: CreatePremiumProfileDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.createPremiumProfileService.create(body, user.id);
  }

  @Post('free')
  @UseGuards(AccessGuard)
  createFree(
    @Body() body: CreateFreeProfileDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.createFreeProfileService.create(body, user.id);
  }

  @Post('monument')
  @UseGuards(AccessGuard)
  createMonument(
    @Body() body: CreatePremiumProfileDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.createPremiumProfileService.create(body, user.id);
  }

  @Get()
  @UseGuards(OptionalAccessGuard)
  findAll(
    @Query() query: FindAllProfilesDto,
    @CurrentUser() user?: { id: string },
  ) {
    return this.findProfileService.findAll(query, user?.id);
  }

  @Get(':id')
  @UseGuards(OptionalAccessGuard)
  findOne(@Param('id') id: string, @CurrentUser() user?: { id: string }) {
    return this.findProfileService.findOne(id, user?.id);
  }

  @Patch('premium/:id')
  @UseGuards(AccessGuard)
  updatePremium(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdatePremiumProfileDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.updatePremiumProfileService.update(
      id,
      updateProfileDto,
      user.id,
    );
  }

  @Patch('free/:id')
  @UseGuards(AccessGuard)
  updateFree(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateFreeProfileDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.updateFreeProfileService.update(id, updateProfileDto, user.id);
  }

  @Delete(':id')
  @UseGuards(AccessGuard)
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.profilesService.remove(id, user.id);
  }

  @Post('media/:id')
  @UseGuards(AccessGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  upload(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.profilesService.uploadMedia(file, id, user.id);
  }

  @Post('gallery/:id')
  @UseGuards(AccessGuard)
  @UseInterceptors(
    FilesInterceptor('gallery', 20, {
      limits: {
        fileSize: 8 * 1024 * 1024,
      },
    }),
  )
  uploadGallery(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 8 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/i,
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.profilesService.uploadGallery(files, id, user.id);
  }
}
