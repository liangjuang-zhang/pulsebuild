import { Inject } from '@nestjs/common';
import { Query, Mutation, Router, UseMiddlewares, Input } from 'nestjs-trpc';
import { z } from 'zod';
import { RoleService } from './role.service';
import { AssignPermissionsInputSchema, CreateRoleInputSchema, DeleteRoleInputSchema, RoleQueryInputSchema, RoleSchema, RoleWithPermissionsSchema, UpdateRoleInputSchema } from './role.schema';
import type { AssignPermissionsInput, CreateRoleInput, DeleteRoleInput, RoleQueryInput, UpdateRoleInput } from './role.schema';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { PermissionMiddleware } from '../../auth/permission.middleware';

/** 角色管理 tRPC 路由 */
@Router({ alias: 'role' })
@UseMiddlewares(AuthMiddleware, PermissionMiddleware)
export class RoleRouter {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  /** 查询角色列表 */
  @Query({
    input: RoleQueryInputSchema,
    output: z.array(RoleSchema),
    meta: { permissions: ['system.role.list'] },
  })
  async list(@Input() input: RoleQueryInput) {
    return this.roleService.list(input);
  }

  /** 获取角色详情（含权限） */
  @Query({
    input: z.object({ id: z.string().min(1) }),
    output: RoleWithPermissionsSchema,
    meta: { permissions: ['system.role.detail'] },
  })
  async detail(@Input() input: { id: string }) {
    return this.roleService.detail(input.id);
  }

  /** 创建角色 */
  @Mutation({
    input: CreateRoleInputSchema,
    output: RoleSchema,
    meta: { permissions: ['system.role.create'] },
  })
  async create(@Input() input: CreateRoleInput) {
    return this.roleService.create(input);
  }

  /** 更新角色 */
  @Mutation({
    input: UpdateRoleInputSchema,
    output: RoleSchema,
    meta: { permissions: ['system.role.update'] },
  })
  async update(@Input() input: UpdateRoleInput) {
    return this.roleService.update(input);
  }

  /** 删除角色 */
  @Mutation({
    input: DeleteRoleInputSchema,
    output: z.void(),
    meta: { permissions: ['system.role.delete'] },
  })
  async remove(@Input() input: DeleteRoleInput) {
    return this.roleService.remove(input.id);
  }

  /** 分配权限给角色（全量覆盖） */
  @Mutation({
    input: AssignPermissionsInputSchema,
    output: z.void(),
    meta: { permissions: ['system.role.assign'] },
  })
  async assignPermissions(@Input() input: AssignPermissionsInput) {
    return this.roleService.assignPermissions(input.roleId, input.permissionIds);
  }
}
