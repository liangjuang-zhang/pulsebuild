import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { UserService } from './user.service';
import { UserRouter } from './user.router';

@Module({
  imports: [DatabaseModule],
  providers: [UserService, UserRouter],
  exports: [UserService],
})
export class UserModule {}
