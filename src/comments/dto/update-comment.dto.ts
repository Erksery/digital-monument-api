import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateCommentStatusDto {
  @IsBoolean({
    message: 'Статус одобрения должен быть логического типа (true/false)',
  })
  isApproved: boolean;
}
