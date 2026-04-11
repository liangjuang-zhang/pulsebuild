import { Inject } from '@nestjs/common';
import { Mutation, Query, Router } from 'nestjs-trpc';
import { z } from 'zod';
import { PermissionService } from './permission.service';
import { CreatePermissionInputSchema, DeletePermissionInputSchema, PermissionSchema, PermissionTreeNodeSchema, UpdatePermissionInputSchema } from './permission.schema';
import type { CreatePermissionInput, DeletePermissionInput, UpdatePermissionInput } from './permission.schema';
import { RequirePermissions } from './permission.decorator';

/** 权限管理 tRPC 路由 */
@Router({ alias: 'permission' })
export class PermissionRouter {
  constructor(@Inject(PermissionService) private readonly permissionService: PermissionService) {}

  /** 查询权限列表（扁平） */
  @RequirePermissions('system.permission.list')
  @Query({ output: z.array(PermissionSchema) })
  async list() {
    return this.permissionService.list();
  }

  /** 查询权限树 */
  @RequirePermissions('system.permission.tree')
  @Query({ output: z.array(PermissionTreeNodeSchema) })
  async tree() {
    return this.permissionService.tree();
  }

  /** 创建权限 */
  @RequirePermissions('system.permission.create')
  @Mutation({ input: CreatePermissionInputSchema, output: PermissionSchema })
  async create(@Inject('input') input: CreatePermissionInput) {
    return this.permissionService.create(input);
  }

  /** 更新权限 */
  @RequirePermissions('system.permission.update')
  @Mutation({ input: UpdatePermissionInputSchema, output: PermissionSchema })
  async update(@Inject('input') input: UpdatePermissionInput) {
    return this.permissionService.update(input);
  }

  /** 删除权限 */
  @RequirePermissions('system.permission.delete')
  @Mutation({ input: DeletePermissionInputSchema, output: z.void() })
  async remove(@Inject('input') input: DeletePermissionInput) {
    return this.permissionService.remove(input.id);
  }
}
