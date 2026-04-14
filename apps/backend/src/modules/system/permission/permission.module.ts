import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { PermissionService } from './permission.service';
import { PermissionRouter } from './permission.router';

@Module({
  imports: [DatabaseModule],
  providers: [PermissionService, PermissionRouter],
  exports: [PermissionService],
})
export class PermissionModule {}
