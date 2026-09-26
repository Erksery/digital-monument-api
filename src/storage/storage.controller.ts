import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';

@Controller('uploads')
export class StorageController {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  @Get(':folder/:filename')
  async getProfileMedia(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = path.resolve(this.uploadDir, folder, filename);

    if (
      filePath !== this.uploadDir &&
      !filePath.startsWith(`${this.uploadDir}${path.sep}`)
    ) {
      throw new BadRequestException('Некорректный путь к файлу');
    }

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('Файл не найден');
    }

    return res.sendFile(filePath);
  }
}
