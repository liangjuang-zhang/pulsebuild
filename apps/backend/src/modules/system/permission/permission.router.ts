import { Inject } from '@nestjs/common';
import { Query, Mutation, Router, UseMiddlewares, Input } from 'nestjs-trpc';
import { z } from 'zod';
import { PermissionService } from './permission.service';
import { CreatePermissionInputSchema, DeletePermissionInputSchema, PermissionSchema, PermissionTreeNodeSchema, UpdatePermissionInputSchema } from './permission.schema';
import type { CreatePermissionInput, DeletePermissionInput, UpdatePermissionInput } from './permission.schema';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { PermissionMiddleware } from '../../auth/permission.middleware';

/** 权限管理 tRPC 路由 */
@Router({ alias: 'permission' })
@UseMiddlewares(AuthMiddleware, PermissionMiddleware)
export class PermissionRouter {
  constructor(@Inject(PermissionService) private readonly permissionService: PermissionService) {}

  /** 查询权限列表（扁平） */
  @Query({
    output: z.array(PermissionSchema),
    meta: { permissions: ['system.permission.list'] },
  })
  async list() {
    return this.permissionService.list();
  }

  /** 查询权限树 */
  @Query({
    output: z.array(PermissionTreeNodeSchema),
    meta: { permissions: ['system.permission.tree'] },
  })
  async tree() {
    return this.permissionService.tree();
  }

  /** 创建权限 */
  @Mutation({
    input: CreatePermissionInputSchema,
    output: PermissionSchema,
    meta: { permissions: ['system.permission.create'] },
  })
  async create(@Input() input: CreatePermissionInput) {
    return this.permissionService.create(input);
  }

  /** 更新权限 */
  @Mutation({
    input: UpdatePermissionInputSchema,
    output: PermissionSchema,
    meta: { permissions: ['system.permission.update'] },
  })
  async update(@Input() input: UpdatePermissionInput) {
    return this.permissionService.update(input);
  }

  /** 删除权限 */
  @Mutation({
    input: DeletePermissionInputSchema,
    output: z.void(),
    meta: { permissions: ['system.permission.delete'] },
  })
  async remove(@Input() input: DeletePermissionInput) {
    return this.permissionService.remove(input.id);
  }
}
