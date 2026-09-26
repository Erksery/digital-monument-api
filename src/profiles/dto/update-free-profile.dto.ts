import { PartialType } from '@nestjs/mapped-types';
import { CreateFreeProfileDto } from './create-free-profile.dto';

export class UpdateFreeProfileDto extends PartialType(CreateFreeProfileDto) {}
