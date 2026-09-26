import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsUUID,
  MaxLength,
  IsObject,
  IsNumber,
  ValidateNested,
  IsEnum,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProfileVisibilityType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SELECTED = 'selected',
}

class CoordinatesDto {
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;
}

export class VisibilityDto {
  @IsEnum(ProfileVisibilityType)
  type: ProfileVisibilityType;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  allowedUserIds?: string[];
}

export class CreatePremiumProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @IsDateString()
  @IsNotEmpty()
  deathDate: string;

  @IsString()
  @IsOptional()
  quote?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  quoteAuthor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  birthPlace?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  deathPlace?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  spouse?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  children?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  citizenship?: string;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  awards?: string[];

  @IsString()
  @IsNotEmpty()
  contentMarkdown: string;

  @IsOptional()
  condolences?: any;

  @IsString()
  @IsOptional()
  burialAddress?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  burialCoordinates?: CoordinatesDto;

  @ValidateNested()
  @Type(() => VisibilityDto)
  visibility: VisibilityDto;

  @IsOptional()
  @IsUUID('4', { each: true })
  editorUserIds?: string[];
}
