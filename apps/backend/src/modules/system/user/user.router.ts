import { Inject } from '@nestjs/common';
import { Query, Mutation, Router, UseMiddlewares, Input } from 'nestjs-trpc';
import { z } from 'zod';
import { UserService } from './user.service';
import {
  AssignUserRoleInputSchema,
  RemoveUserRoleInputSchema,
  UserPermissionsResultSchema,
  UserRoleInfoSchema,
  UserRoleQueryInputSchema,
  ValidateContactInputSchema,
  ValidateContactResultSchema,
} from './user.schema';
import type { AssignUserRoleInput, RemoveUserRoleInput, UserRoleQueryInput, ValidateContactInput } from './user.schema';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { PermissionMiddleware } from '../../auth/permission.middleware';

/** 用户角色管理 tRPC 路由 */
@Router({ alias: 'user' })
@UseMiddlewares(AuthMiddleware, PermissionMiddleware)
export class UserRouter {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  /** 校验联系方式唯一性（onboarding 用） */
  @Query({
    input: ValidateContactInputSchema,
    output: ValidateContactResultSchema,
  })
  async validateContact(@Input() input: ValidateContactInput) {
    return await this.userService.validateContact(input);
  }

  /** 查询用户角色 */
  @Query({
    input: UserRoleQueryInputSchema,
    output: z.array(UserRoleInfoSchema),
    meta: { permissions: ['system.user.role.list'] },
  })
  async list(@Input() input: UserRoleQueryInput) {
    return await this.userService.getUserRoles(input);
  }

  /** 查询用户权限 */
  @Query({
    input: UserRoleQueryInputSchema,
    output: UserPermissionsResultSchema,
    meta: { permissions: ['system.user.role.permissions'] },
  })
  async permissions(@Input() input: UserRoleQueryInput) {
    return await this.userService.getUserPermissions(input.userId, input.projectId);
  }

  /** 分配角色给用户 */
  @Mutation({
    input: AssignUserRoleInputSchema,
    output: z.void(),
    meta: { permissions: ['system.user.role.assign'] },
  })
  async assign(@Input() input: AssignUserRoleInput) {
    return await this.userService.assignRole(input);
  }

  /** 移除用户角色 */
  @Mutation({
    input: RemoveUserRoleInputSchema,
    output: z.void(),
    meta: { permissions: ['system.user.role.remove'] },
  })
  async remove(@Input() input: RemoveUserRoleInput) {
    return await this.userService.removeRole(input);
  }
}
