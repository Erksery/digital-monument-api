import { forwardRef, Module } from '@nestjs/common';
import { ProfilesService } from './services/profiles.service';
import { ProfilesController } from './profiles.controller';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { FindProfileService } from './services/find-profile.service';
import { CreatePremiumProfileService } from './services/create-premium-profile.service';
import { CreateFreeProfileService } from './services/create-free-profile.service';
import { UpdateFreeProfileService } from './services/update-free-profile.service';
import { CheckAccessService } from './services/check-access.service';
import { UpdatePremiumProfileService } from './services/update-premium-profile.service';
import { PurchaseAccessService } from './services/purchase-access-profile.service';

@Module({
  imports: [forwardRef(() => AuthModule), StorageModule],
  controllers: [ProfilesController],
  providers: [
    ProfilesService,
    FindProfileService,
    CreatePremiumProfileService,
    CreateFreeProfileService,
    UpdatePremiumProfileService,
    UpdateFreeProfileService,
    CheckAccessService,
    PurchaseAccessService,
  ],
})
export class ProfilesModule {}
