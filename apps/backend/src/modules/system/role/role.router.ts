import { Inject } from '@nestjs/common';
import { Mutation, Query, Router } from 'nestjs-trpc';
import { z } from 'zod';
import { RoleService } from './role.service';
import { RequirePermissions } from '../permission/permission.decorator';
import { AssignPermissionsInputSchema, CreateRoleInputSchema, DeleteRoleInputSchema, RoleQueryInputSchema, RoleSchema, RoleWithPermissionsSchema, UpdateRoleInputSchema } from './role.schema';
import type { AssignPermissionsInput, CreateRoleInput, DeleteRoleInput, RoleQueryInput, UpdateRoleInput } from './role.schema';

/** 角色管理 tRPC 路由 */
@Router({ alias: 'role' })
export class RoleRouter {
  constructor(@Inject(RoleService) private readonly roleService: RoleService) {}

  /** 查询角色列表 */
  @RequirePermissions('system.role.list')
  @Query({ input: RoleQueryInputSchema, output: z.array(RoleSchema) })
  async list(@Inject('input') input: RoleQueryInput) {
    return this.roleService.list(input);
  }

  /** 获取角色详情（含权限） */
  @RequirePermissions('system.role.detail')
  @Query({ input: z.object({ id: z.string().min(1) }), output: RoleWithPermissionsSchema })
  async detail(@Inject('input') input: { id: string }) {
    return this.roleService.detail(input.id);
  }

  /** 创建角色 */
  @RequirePermissions('system.role.create')
  @Mutation({ input: CreateRoleInputSchema, output: RoleSchema })
  async create(@Inject('input') input: CreateRoleInput) {
    return this.roleService.create(input);
  }

  /** 更新角色 */
  @RequirePermissions('system.role.update')
  @Mutation({ input: UpdateRoleInputSchema, output: RoleSchema })
  async update(@Inject('input') input: UpdateRoleInput) {
    return this.roleService.update(input);
  }

  /** 删除角色 */
  @RequirePermissions('system.role.delete')
  @Mutation({ input: DeleteRoleInputSchema, output: z.void() })
  async remove(@Inject('input') input: DeleteRoleInput) {
    return this.roleService.remove(input.id);
  }

  /** 分配权限给角色（全量覆盖） */
  @RequirePermissions('system.role.assign')
  @Mutation({ input: AssignPermissionsInputSchema, output: z.void() })
  async assignPermissions(@Inject('input') input: AssignPermissionsInput) {
    return this.roleService.assignPermissions(input.roleId, input.permissionIds);
  }
}
