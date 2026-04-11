import { Inject, Injectable, Logger } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import { DATABASE_CONNECTION } from '../../../database/database.module';
import * as schema from '../../../database';
import { sysPermission } from '../../../database/rbac.schema';
import type { CreatePermissionInput, Permission, PermissionTreeNode, UpdatePermissionInput } from './permission.schema';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /** 查询所有权限（扁平列表） */
  async list(): Promise<Permission[]> {
    const rows = await this.db.select().from(sysPermission).orderBy(sysPermission.orderIndex);
    return rows.map((r) => this.toPermission(r));
  }

  /** 查询权限树 */
  async tree(): Promise<PermissionTreeNode[]> {
    const all = await this.list();
    return this.buildTree(all, null);
  }

  /** 创建权限 */
  async create(input: CreatePermissionInput): Promise<Permission> {
    const existing = await this.db.select().from(sysPermission).where(eq(sysPermission.code, input.code)).limit(1);
    if (existing[0]) {
      throw new TRPCError({ code: 'CONFLICT', message: `权限编码 ${input.code} 已存在` });
    }

    if (input.parentId) {
      const parent = await this.db.select().from(sysPermission).where(eq(sysPermission.id, input.parentId)).limit(1);
      if (!parent[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '父权限不存在' });
      }
    }

    const id = crypto.randomUUID();
    const [row] = await this.db
      .insert(sysPermission)
      .values({
        id,
        code: input.code,
        name: input.name,
        type: input.type,
        parentId: input.parentId ?? null,
        orderIndex: input.orderIndex,
        description: input.description ?? null,
      })
      .returning();

    this.logger.log(`Permission created: ${input.code}`);
    return this.toPermission(row);
  }

  /** 更新权限 */
  async update(input: UpdatePermissionInput): Promise<Permission> {
    const existing = await this.db.select().from(sysPermission).where(eq(sysPermission.id, input.id)).limit(1);
    if (!existing[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '权限不存在' });
    }

    if (input.parentId !== undefined && input.parentId === input.id) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: '不能将自身设为父权限' });
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.parentId !== undefined) updateData.parentId = input.parentId;
    if (input.orderIndex !== undefined) updateData.orderIndex = input.orderIndex;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [row] = await this.db.update(sysPermission).set(updateData).where(eq(sysPermission.id, input.id)).returning();
    this.logger.log(`Permission updated: ${input.id}`);
    return this.toPermission(row);
  }

  /** 删除权限（级联删除子权限） */
  async remove(id: string): Promise<void> {
    const existing = await this.db.select().from(sysPermission).where(eq(sysPermission.id, id)).limit(1);
    if (!existing[0]) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '权限不存在' });
    }

    await this.db.delete(sysPermission).where(eq(sysPermission.id, id));
    this.logger.log(`Permission deleted: ${id}`);
  }

  private buildTree(items: Permission[], parentId: string | null): PermissionTreeNode[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }));
  }

  private toPermission(row: typeof sysPermission.$inferSelect): Permission {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      parentId: row.parentId,
      orderIndex: row.orderIndex,
      description: row.description,
      isActive: row.isActive,
    };
  }
}
