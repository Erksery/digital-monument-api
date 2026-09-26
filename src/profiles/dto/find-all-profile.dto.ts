import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsString,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'username',
  'id',
  'fullName',
  'birthDate',
  'deathDate',
];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

export class FindAllProfilesDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number =
    50;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page: number = 0;
  @IsOptional() @IsString() @IsIn(ALLOWED_SORT_FIELDS) sortBy: string =
    'createdAt';
  @IsOptional() @IsString() @IsIn(ALLOWED_SORT_ORDERS) sortOrder:
    | 'asc'
    | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'birthDate должна быть валидной ISO датой (YYYY-MM-DD)' },
  )
  birthDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'deathDate должна быть валидной ISO датой (YYYY-MM-DD)' },
  )
  deathDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'userId должен быть валидным UUIDv4' })
  userId?: string;
}
