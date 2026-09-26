import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PrismaService } from '../prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const hashPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.users.create({
      data: { ...data, password: hashPassword },
      omit: { password: true },
    });
  }

  findAll(params: Prisma.usersFindManyArgs) {
    return this.prisma.users.findMany({
      ...params,
      omit: { password: true },
    });
  }

  async findOne(params: Prisma.usersFindUniqueArgs) {
    const user = await this.prisma.users.findUnique({
      ...params,
      omit: { password: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async findByLoginOrEmail(login: string, email?: string) {
    return this.prisma.users.findFirst({
      where: {
        OR: [{ login }, ...(email ? [{ email }] : [])],
      },
      omit: {
        password: true,
      },
    });
  }

  async findByLoginOrEmailWithPassword(login: string, email?: string) {
    return this.prisma.users.findFirst({
      where: {
        OR: [{ login }, ...(email ? [{ email }] : [])],
      },
    });
  }

  async search(query: string | undefined) {
    return this.prisma.users.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [
                  {
                    login: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                  {
                    email: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : {},
        ],
      },
      take: 20,
      orderBy: {
        login: 'asc',
      },
      omit: {
        password: true,
      },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    const hashPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.users.update({
      where: { id },
      data: { ...data, password: hashPassword },
      omit: { password: true },
    });
  }

  remove(id: string) {
    return this.prisma.users.delete({
      where: { id },
      omit: { password: true },
    });
  }

  async verifyEmail(userId: string) {
    return this.prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        is_verified: true,
      },

      omit: {
        password: true,
      },
    });
  }

  async findById(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }
}
