import { Inject, Injectable, Logger } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import { DATABASE_CONNECTION } from '../../../database/database.module';
import * as schema from '../../../database';
import { user } from '../../../database/auth.schema';
import { sysPermission, sysRole, sysRolePermission, sysUserRole } from '../../../database/rbac.schema';
import type { AssignUserRoleInput, RemoveUserRoleInput, UserPermissionsResult, UserRoleInfo, UserRoleQueryInput, ValidateContactInput, ValidateContactResult } from './user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /** 校验联系方式（email / phoneNumber）是否已被其他用户占用 */
  async validateContact(input: ValidateContactInput): Promise<ValidateContactResult> {
    this.logger.debug(`validateContact input: ${JSON.stringify(input)}`);
    const conflicts: Array<'email' | 'phoneNumber'> = [];
    this.logger.debug(`Validating contact for user ${input.userId}: email=${input.email}, phoneNumber=${input.phoneNumber}`);
    if (input.email) {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existing = await this.db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.email, normalizedEmail), ne(user.id, input.userId)))
        .limit(1);
      if (existing.length > 0) {
        conflicts.push('email');
      }
    }

    if (input.phoneNumber) {
      const existing = await this.db
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.phoneNumber, input.phoneNumber), ne(user.id, input.userId)))
        .limit(1);
      if (existing.length > 0) {
        conflicts.push('phoneNumber');
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  }

  async assignRole(input: AssignUserRoleInput): Promise<void> {
    const role = await this.db.select().from(sysRole).where(eq(sysRole.id, input.roleId)).limit(1);
    if (!role[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '角色不存在' });
    }

    const projectId = input.projectId ?? null;
    const existing = await this.db
      .select()
      .from(sysUserRole)
      .where(and(eq(sysUserRole.userId, input.userId), eq(sysUserRole.roleId, input.roleId), projectId === null ? isNull(sysUserRole.projectId) : eq(sysUserRole.projectId, projectId)))
      .limit(1);

    if (existing[0]) {
      throw new TRPCError({ code: 'CONFLICT', message: '用户已拥有该角色' });
    }

    await this.db.insert(sysUserRole).values({
      id: crypto.randomUUID(),
      userId: input.userId,
      roleId: input.roleId,
      projectId,
    });

    this.logger.log(`User ${input.userId} assigned role ${input.roleId} (project: ${projectId})`);
  }

  /** 移除用户的角色 */
  async removeRole(input: RemoveUserRoleInput): Promise<void> {
    const projectId = input.projectId ?? null;
    const existing = await this.db
      .select()
      .from(sysUserRole)
      .where(and(eq(sysUserRole.userId, input.userId), eq(sysUserRole.roleId, input.roleId), projectId === null ? isNull(sysUserRole.projectId) : eq(sysUserRole.projectId, projectId)))
      .limit(1);

    if (!existing[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '用户角色关联不存在' });
    }

    await this.db.delete(sysUserRole).where(eq(sysUserRole.id, existing[0].id));
    this.logger.log(`User ${input.userId} removed role ${input.roleId} (project: ${projectId})`);
  }

  /** 查询用户角色列表 */
  async getUserRoles(input: UserRoleQueryInput): Promise<UserRoleInfo[]> {
    const projectId = input.projectId ?? null;
    const rows = await this.db
      .select({
        roleId: sysRole.id,
        roleCode: sysRole.code,
        roleName: sysRole.name,
        roleLevel: sysRole.level,
        isActive: sysRole.isActive,
        projectId: sysUserRole.projectId,
      })
      .from(sysUserRole)
      .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
      .where(and(eq(sysUserRole.userId, input.userId), projectId === null ? isNull(sysUserRole.projectId) : eq(sysUserRole.projectId, projectId)));

    return rows
      .filter((r) => r.isActive)
      .map((r) => ({
        roleId: r.roleId,
        roleCode: r.roleCode,
        roleName: r.roleName,
        roleLevel: r.roleLevel,
        projectId: r.projectId,
      }));
  }

  /** 获取用户的角色编码和权限编码 */
  async getUserPermissions(userId: string, projectId?: string | null): Promise<UserPermissionsResult> {
    const pId = projectId ?? null;

    // 查询用户角色（系统级 + 指定项目级）
    const userRoleRows = await this.db
      .select({
        roleId: sysRole.id,
        roleCode: sysRole.code,
        isActive: sysRole.isActive,
      })
      .from(sysUserRole)
      .innerJoin(sysRole, eq(sysUserRole.roleId, sysRole.id))
      .where(pId === null ? and(eq(sysUserRole.userId, userId), isNull(sysUserRole.projectId)) : eq(sysUserRole.userId, userId));

    const activeRoles = userRoleRows.filter((r) => r.isActive);
    const roleCodes = activeRoles.map((r) => r.roleCode);
    const roleIds = activeRoles.map((r) => r.roleId);

    if (roleIds.length === 0) {
      return { roles: [], permissions: [] };
    }

    // 查询角色关联的权限
    const permRows = await this.db
      .select({ code: sysPermission.code, isActive: sysPermission.isActive })
      .from(sysRolePermission)
      .innerJoin(sysPermission, eq(sysRolePermission.permissionId, sysPermission.id))
      .where(inArray(sysRolePermission.roleId, roleIds));

    const permCodes = [...new Set(permRows.filter((r) => r.isActive).map((r) => r.code))];

    return {
      roles: [...new Set(roleCodes)],
      permissions: permCodes,
    };
  }
}
