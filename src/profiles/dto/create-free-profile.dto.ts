import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFreeProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @IsOptional()
  @IsDateString()
  deathDate?: string;
}
