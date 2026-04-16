/**
 * 同步模块 - WatermelonDB 同步协议
 *
 * 自动注册所有同步处理器：
 * - UserSyncHandler: 用户表同步
 *
 * 认证：
 * - AuthMiddleware 在 AppModule 中全局注册
 * - SyncRouter 使用 @UseMiddlewares(AuthMiddleware) 应用认证
 */
import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from '../../../database/database.module';
import { SyncService } from './sync.service';
import { SyncRouter } from './sync.router';
import { UserSyncHandler } from './handlers/user-sync.handler';

@Module({
  imports: [DatabaseModule],
  providers: [SyncService, SyncRouter, UserSyncHandler],
  exports: [SyncService],
})
export class SyncModule implements OnModuleInit {
  constructor(
    private readonly syncService: SyncService,
    private readonly userSyncHandler: UserSyncHandler,
  ) {}

  /**
   * 模块初始化时注册所有处理器
   */
  onModuleInit() {
    this.syncService.registerHandler(this.userSyncHandler);
  }
}
