import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  login?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @MinLength(6)
  password: string;
}
