import { PartialType } from '@nestjs/mapped-types';
import { CreatePremiumProfileDto } from './create-premium-profile.dto';

export class UpdatePremiumProfileDto extends PartialType(
  CreatePremiumProfileDto,
) {}
