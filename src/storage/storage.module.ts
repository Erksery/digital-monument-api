import { forwardRef, Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';
import { AuthModule } from '../auth/auth.module';
// S3 import

export const STORAGE_TOKEN = 'STORAGE_SERVICE_TOKEN';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_TOKEN,
      useClass: LocalStorageService,
      // useClass: S3StorageService, // S3 class
    },
  ],
  exports: [STORAGE_TOKEN],
})
export class StorageModule {}
