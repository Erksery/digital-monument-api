import { forwardRef, Module } from '@nestjs/common';
import { CloudPaymentsService } from './services/cloud-payments.service';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [PaymentsController],
  providers: [CloudPaymentsService],
})
export class PaymentsModule {}
