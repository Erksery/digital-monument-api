import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CloudPaymentsNotificationDto } from '../dto/cloudpayments-notification.dto';
import { Prisma, profile_purchases } from '../../generated/prisma/client';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CloudPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async handlePay(data: CloudPaymentsNotificationDto, req: Request) {
    /*
    this.verifySignature(req);
    */
    const purchase = await this.findPurchase(data.InvoiceId);

    await this.markAsPaid(purchase, data);

    return {
      code: 0,
    };
  }

  handleFail(data: CloudPaymentsNotificationDto) {
    return {
      code: 0,
    };
  }

  async findPurchase(invoiceId: string) {
    const purchase = await this.prisma.profile_purchases.findUnique({
      where: {
        invoiceId,
      },
    });

    if (!purchase) {
      throw new NotFoundException(
        `Покупка с invoiceId "${invoiceId}" не найдена`,
      );
    }

    return purchase;
  }

  async getPremiumAccess(userId: string) {
    const count = await this.prisma.profile_purchases.count({
      where: {
        userId,
        status: 'paid',
        activatedAt: null,
        type: 'premium',
      },
    });

    return {
      available: count > 0,
      count,
    };
  }

  private async markAsPaid(
    purchase: profile_purchases,
    data: CloudPaymentsNotificationDto,
  ) {
    if (purchase.status === 'paid') {
      return purchase;
    }

    return this.prisma.profile_purchases.update({
      where: {
        id: purchase.id,
      },
      data: {
        status: 'paid',
        paidAt: new Date(data.DateTime),
        transactionId: String(data.TransactionId),
        payload: data as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async createTestPremiumPurchase(userId: string) {
    const purchase = await this.prisma.profile_purchases.create({
      data: {
        userId,
        type: 'premium',
        status: 'paid',
        amount: 3000,
        currency: 'RUB',
        invoiceId: `test-${uuidv4()}`,
        transactionId: `test-${uuidv4()}`,
        paidAt: new Date(),
        payload: {
          test: true,
          source: 'test-premium-endpoint',
        },
      },
    });

    return {
      success: true,
      purchaseId: purchase.id,
      type: purchase.type,
      status: purchase.status,
      amount: purchase.amount,
      currency: purchase.currency,
    };
  }
}
