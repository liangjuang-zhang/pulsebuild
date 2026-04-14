import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { RoleService } from './role.service';
import { RoleRouter } from './role.router';

@Module({
  imports: [DatabaseModule],
  providers: [RoleService, RoleRouter],
  exports: [RoleService],
})
export class RoleModule {}
