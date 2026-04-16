import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { SendRateLimiter } from '../../../common/throttling';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, SendRateLimiter],
  exports: [EmailService, SendRateLimiter],
})
export class EmailModule {}
