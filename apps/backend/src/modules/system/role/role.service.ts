import { Inject, Injectable, Logger } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, inArray } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import { DATABASE_CONNECTION } from '../../../database/database.module';
import * as schema from '../../../database';
import { sysPermission, sysRole, sysRolePermission } from '../../../database/rbac.schema';
import type { CreateRoleInput, Role, RoleQueryInput, RoleWithPermissions, UpdateRoleInput } from './role.schema';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /** 查询角色列表 */
  async list(input: RoleQueryInput): Promise<Role[]> {
    const conditions: SQL[] = [];
    if (input.type) {
      conditions.push(eq(sysRole.type, input.type));
    }
    if (input.isActive !== undefined) {
      conditions.push(eq(sysRole.isActive, input.isActive));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await this.db.select().from(sysRole).where(where).orderBy(sysRole.level);

    return rows.map((r) => this.toRole(r));
  }

  /** 获取角色详情（含权限） */
  async detail(id: string): Promise<RoleWithPermissions> {
    const row = await this.db.select().from(sysRole).where(eq(sysRole.id, id)).limit(1);
    if (!row[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '角色不存在' });
    }

    const perms = await this.db
      .select({
        id: sysPermission.id,
        code: sysPermission.code,
        name: sysPermission.name,
      })
      .from(sysRolePermission)
      .innerJoin(sysPermission, eq(sysRolePermission.permissionId, sysPermission.id))
      .where(eq(sysRolePermission.roleId, id));

    return {
      ...this.toRole(row[0]),
      permissions: perms,
    };
  }

  /** 创建角色 */
  async create(input: CreateRoleInput): Promise<Role> {
    const existing = await this.db.select().from(sysRole).where(eq(sysRole.code, input.code)).limit(1);
    if (existing[0]) {
      throw new TRPCError({ code: 'CONFLICT', message: `角色编码 ${input.code} 已存在` });
    }

    const id = crypto.randomUUID();
    const [row] = await this.db
      .insert(sysRole)
      .values({
        id,
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        type: input.type,
        level: input.level,
      })
      .returning();

    this.logger.log(`Role created: ${input.code}`);
    return this.toRole(row);
  }

  /** 更新角色 */
  async update(input: UpdateRoleInput): Promise<Role> {
    const existing = await this.db.select().from(sysRole).where(eq(sysRole.id, input.id)).limit(1);
    if (!existing[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '角色不存在' });
    }
    if (existing[0].isBuiltin) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '系统内置角色不可修改' });
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [row] = await this.db.update(sysRole).set(updateData).where(eq(sysRole.id, input.id)).returning();
    this.logger.log(`Role updated: ${input.id}`);
    return this.toRole(row);
  }

  /** 删除角色 */
  async remove(id: string): Promise<void> {
    const existing = await this.db.select().from(sysRole).where(eq(sysRole.id, id)).limit(1);
    if (!existing[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '角色不存在' });
    }
    if (existing[0].isBuiltin) {
      throw new TRPCError({ code: 'FORBIDDEN', message: '系统内置角色不可删除' });
    }

    await this.db.delete(sysRole).where(eq(sysRole.id, id));
    this.logger.log(`Role deleted: ${id}`);
  }

  /** 分配权限给角色（全量覆盖） */
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const role = await this.db.select().from(sysRole).where(eq(sysRole.id, roleId)).limit(1);
    if (!role[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '角色不存在' });
    }

    await this.db.transaction(async (tx) => {
      await tx.delete(sysRolePermission).where(eq(sysRolePermission.roleId, roleId));

      if (permissionIds.length > 0) {
        await tx.insert(sysRolePermission).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
      }
    });

    this.logger.log(`Role ${roleId} permissions updated: ${permissionIds.length} permissions`);
  }

  /** 获取角色的权限编码列表 */
  async getPermissionCodes(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];

    const rows = await this.db
      .select({ code: sysPermission.code, isActive: sysPermission.isActive })
      .from(sysRolePermission)
      .innerJoin(sysPermission, eq(sysRolePermission.permissionId, sysPermission.id))
      .where(inArray(sysRolePermission.roleId, roleIds));

    return [...new Set(rows.filter((r) => r.isActive).map((r) => r.code))];
  }

  private toRole(row: typeof sysRole.$inferSelect): Role {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      type: row.type,
      level: row.level,
      isActive: row.isActive,
      isBuiltin: row.isBuiltin,
      createdAt: row.createdAt,
    };
  }
}
