import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleRouter } from './role.router';

@Module({
  providers: [RoleService, RoleRouter],
  exports: [RoleService],
})
export class RoleModule {}
