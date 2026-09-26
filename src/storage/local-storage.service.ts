import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IStorageService } from './storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  private resolveSafePath(...segments: string[]): string {
    const resolvedPath = path.resolve(this.uploadDir, ...segments);

    if (
      resolvedPath !== this.uploadDir &&
      !resolvedPath.startsWith(`${this.uploadDir}${path.sep}`)
    ) {
      throw new Error('Попытка доступа за пределы upload-директории');
    }

    return resolvedPath;
  }

  private resolveStoredFilePath(filePath: string): string {
    const normalizedPath = filePath.replace(/\\/g, '/');

    const uploadsPrefix = 'uploads/';

    if (!normalizedPath.startsWith(uploadsPrefix)) {
      throw new Error('Некорректный путь к файлу');
    }

    const relativePath = normalizedPath.slice(uploadsPrefix.length);

    return this.resolveSafePath(...relativePath.split('/'));
  }

  constructor() {
    fs.mkdir(this.uploadDir, { recursive: true }).catch((err) => {
      console.error('Не удалось создать папку для загрузок', err);
    });
  }

  async uploadFile(file: Express.Multer.File, folder = ''): Promise<string> {
    try {
      const targetDir = this.resolveSafePath(folder);

      await fs.mkdir(targetDir, { recursive: true });

      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;

      const fullPath = this.resolveSafePath(folder, fileName);

      await fs.writeFile(fullPath, file.buffer);

      return path.join('uploads', folder, fileName).replace(/\\/g, '/');
    } catch {
      throw new InternalServerErrorException(
        'Ошибка при сохранении файла на диск',
      );
    }
  }

  async uploadFiles(
    files: Express.Multer.File[],
    folder = '',
  ): Promise<string[]> {
    if (!files || files.length === 0) return [];

    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      return await Promise.all(uploadPromises);
    } catch {
      throw new InternalServerErrorException(
        'Ошибка при массовом сохранении файлов на диск',
      );
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = this.resolveStoredFilePath(filePath);

      await fs.unlink(fullPath);
    } catch (error) {
      console.error(`Не удалось удалить файл: ${filePath}`, error);
    }
  }

  getFileUrl(filePath: string): string {
    if (!filePath) return '';

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }

    return `/${filePath.replace(/\\/g, '/')}`;
  }
}
