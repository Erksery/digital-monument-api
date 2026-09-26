import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface AuthenticatedUser {
  id: string;
  login: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const requiredRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) ??
      this.reflector.get<string[]>('roles', context.getClass()) ??
      [];

    if (!requiredRoles.length) {
      return true;
    }

    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Роль пользователя не определена');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Доступ запрещен: недостаточно прав');
    }

    return true;
  }
}
