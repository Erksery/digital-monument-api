import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AccessGuard } from '../common/guards/access.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @UseGuards(AccessGuard)
  searchUsers(@Query() query: { query?: string }) {
    return this.usersService.search(query.query);
  }

  @Get('me')
  @UseGuards(AccessGuard)
  findMyProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.findOne({ where: { id: user.id } });
  }

  @Patch('me')
  @UseGuards(AccessGuard)
  updateMyProfile(
    @CurrentUser() user: { id: string },
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, body);
  }

  @Post()
  @UseGuards(AccessGuard, RolesGuard)
  @Roles('admin')
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  @UseGuards(AccessGuard, RolesGuard)
  @Roles('admin')
  findAll(@Query() query: FindAllUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AccessGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne({ where: { id } });
  }

  @Patch(':id')
  @UseGuards(AccessGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AccessGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
