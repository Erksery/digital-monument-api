export class CloudPaymentsNotificationDto {
  TransactionId: number;

  Amount: number;

  Currency: string;

  InvoiceId: string;

  AccountId?: string;

  Status: string;

  DateTime: string;

  TestMode: boolean;

  Data?: Record<string, unknown>;
}
