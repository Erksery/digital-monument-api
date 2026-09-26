import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;

  where?: any;
  cursor?: any;
  orderBy?: any;
}
