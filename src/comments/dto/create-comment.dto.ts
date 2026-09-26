import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsUUID('4', { message: 'Идентификатор профиля должен быть валидным UUID' })
  @IsNotEmpty({ message: 'Идентификатор профиля обязателен' })
  profileId: string;

  @IsString({ message: 'Текст комментария должен быть строкой' })
  @MaxLength(500, {
    message: 'Текст комментария не должен превышать 500 символов',
  })
  @IsNotEmpty({ message: 'Текст комментария не может быть пустым' })
  text: string;

  @IsString({ message: 'Роль должна быть строкой' })
  @MaxLength(30, { message: 'Роль не должна превышать 30 символов' })
  @IsNotEmpty({
    message: 'Укажите, кем вы приходитесь человеку (например, "Друг", "Брат")',
  })
  @MaxLength(30, { message: 'Название роли не должно превышать 30 символов' })
  authorRole: string;

  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @MaxLength(30, { message: 'Имя не должно превышать 30 символов' })
  customName?: string;
}
