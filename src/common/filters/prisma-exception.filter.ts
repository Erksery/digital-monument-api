import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      `Prisma Error Code: ${exception.code} | Message: ${exception.message}`,
    );

    switch (exception.code) {
      // P2002: Ошибка уникального ключа
      case 'P2002': {
        const status = 409;
        return response.status(status).json({
          statusCode: status,
          error: 'Conflict',
          message: 'Запись с такими данными уже существует',
        });
      }

      // P2025: Запись для обновления/удаления не найдена
      case 'P2025': {
        const status = 404;
        return response.status(status).json({
          statusCode: status,
          error: 'Not Found',
          message: 'Запрашиваемая запись не найдена в базе данных',
        });
      }

      // P2003: Ошибка внешнего ключа
      case 'P2003': {
        const status = 400;
        return response.status(status).json({
          statusCode: status,
          error: 'Bad Request',
          message:
            'Не удалось выполнить операцию: связанная сущность не существует',
        });
      }

      // Любые другие системные ошибки Prisma
      default: {
        const status = 500;
        return response.status(status).json({
          statusCode: status,
          error: 'Internal Server Error',
          message: 'Внутренняя ошибка базы данных',
        });
      }
    }
  }
}
