import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionRouter } from './permission.router';

@Module({
  providers: [PermissionService, PermissionRouter],
  exports: [PermissionService],
})
export class PermissionModule {}
