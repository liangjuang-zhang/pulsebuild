import { Inject } from '@nestjs/common';
import { Mutation, Query, Router } from 'nestjs-trpc';
import { z } from 'zod';
import { UserService } from './user.service';
import { AssignUserRoleInputSchema, RemoveUserRoleInputSchema, UserPermissionsResultSchema, UserRoleInfoSchema, UserRoleQueryInputSchema } from './user.schema';
import type { AssignUserRoleInput, RemoveUserRoleInput, UserRoleQueryInput } from './user.schema';
import { RequirePermissions } from '../permission/permission.decorator';

/** 用户角色管理 tRPC 路由 */
@Router({ alias: 'user' })
export class UserRouter {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  /** 查询用户角色 */
  @RequirePermissions('system.user.role.list')
  @Query({ input: UserRoleQueryInputSchema, output: z.array(UserRoleInfoSchema) })
  async list(@Inject('input') input: UserRoleQueryInput) {
    return await this.userService.getUserRoles(input);
  }

  /** 查询用户权限 */
  @RequirePermissions('system.user.role.permissions')
  @Query({ input: UserRoleQueryInputSchema, output: UserPermissionsResultSchema })
  async permissions(@Inject('input') input: UserRoleQueryInput) {
    return await this.userService.getUserPermissions(input.userId, input.projectId);
  }

  /** 分配角色给用户 */
  @RequirePermissions('system.user.role.assign')
  @Mutation({ input: AssignUserRoleInputSchema, output: z.void() })
  async assign(@Inject('input') input: AssignUserRoleInput) {
    return await this.userService.assignRole(input);
  }

  /** 移除用户角色 */
  @RequirePermissions('system.user.role.remove')
  @Mutation({ input: RemoveUserRoleInputSchema, output: z.void() })
  async remove(@Inject('input') input: RemoveUserRoleInput) {
    return await this.userService.removeRole(input);
  }
}
