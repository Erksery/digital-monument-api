import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokensService } from './tokens.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { OtpService } from './otp.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokensService, OtpService],
  imports: [forwardRef(() => UsersModule), JwtModule.register({})],
  exports: [AuthService, TokensService, JwtModule],
})
export class AuthModule {}
