import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CloudPaymentsService } from './services/cloud-payments.service';
import { CloudPaymentsNotificationDto } from './dto/cloudpayments-notification.dto';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AccessGuard } from '../common/guards/access.guard';

@Controller('payments/cloudpayments')
export class PaymentsController {
  constructor(private readonly cloudPaymentsService: CloudPaymentsService) {}

  @Post('pay')
  @HttpCode(200)
  pay(@Body() body: CloudPaymentsNotificationDto, @Req() req: Request) {
    return this.cloudPaymentsService.handlePay(body, req);
  }

  @Post('fail')
  @HttpCode(200)
  fail(@Body() body: CloudPaymentsNotificationDto) {
    return this.cloudPaymentsService.handleFail(body);
  }

  @Get('premium/access')
  @UseGuards(AccessGuard)
  getPremiumAccess(@CurrentUser() user: { id: string }) {
    return this.cloudPaymentsService.getPremiumAccess(user.id);
  }

  // TODO: удалить после тестирования оплаты
  @Post('test/premium')
  @UseGuards(AccessGuard)
  testPremium(@CurrentUser() user: { id: string }) {
    return this.cloudPaymentsService.createTestPremiumPurchase(user.id);
  }
}
