import { Multer } from 'multer';

export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  getFileUrl(filePath: string): string;
  uploadFiles(files: Express.Multer.File[], folder?: string): Promise<string[]>;
}
