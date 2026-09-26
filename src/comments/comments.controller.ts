import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AccessGuard } from '../common/guards/access.guard';
import { UpdateCommentStatusDto } from './dto/update-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AccessGuard)
  create(@Body() body: CreateCommentDto, @CurrentUser() user: { id: string }) {
    return this.commentsService.create(body, user.id);
  }

  @Get('my')
  @UseGuards(AccessGuard)
  findAllWithUser(@CurrentUser() user: { id: string }) {
    return this.commentsService.findAllWithUser(user.id);
  }

  @Get()
  findAllWithProfile(
    @Query('profileId', new ParseUUIDPipe({ version: '4' }))
    profileId: string,
  ) {
    return this.commentsService.findAllWithProfile(profileId);
  }

  @Get(':profileId')
  @UseGuards(AccessGuard)
  findAllForProfileOwner(
    @Param('profileId', new ParseUUIDPipe({ version: '4' }))
    profileId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.commentsService.findAllForProfileOwner(profileId, user.id);
  }

  @Patch(':id')
  @UseGuards(AccessGuard)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateCommentStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.commentsService.update(body, id, user.id);
  }

  @Delete(':id')
  @UseGuards(AccessGuard)
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.commentsService.remove(id, user.id);
  }
}
