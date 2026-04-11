import { pgTable, text, timestamp, varchar, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth.schema';

// ==================== 系统角色表 ====================

/**
 * 系统角色
 *
 * 定义系统级和项目级角色，如 admin / builder / worker 等。
 */
export const sysRole = pgTable(
  'sys_role',
  {
    id: text('id').primaryKey(),
    /** 角色编码，唯一标识，如 admin / builder / worker */
    code: varchar('code', { length: 50 }).notNull().unique(),
    /** 角色名称（显示用） */
    name: varchar('name', { length: 100 }).notNull(),
    /** 角色描述 */
    description: text('description'),
    /** 角色类型：system = 系统内置, project = 项目级 */
    type: varchar('type', { length: 20 }).notNull().default('project'),
    /** 角色层级（数字越小权限越高），用于角色层级比较 */
    level: integer('level').notNull().default(100),
    /** 是否启用 */
    isActive: boolean('is_active').notNull().default(true),
    /** 是否系统内置（不可删除） */
    isBuiltin: boolean('is_builtin').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('sys_role_type_idx').on(table.type), index('sys_role_level_idx').on(table.level)],
);

// ==================== 系统权限表 ====================

/**
 * 系统权限
 *
 * 支持树形结构，type 区分菜单 / 按钮 / API 权限。
 */
export const sysPermission = pgTable(
  'sys_permission',
  {
    id: text('id').primaryKey(),
    /** 权限编码，如 project:create / project:member:add */
    code: varchar('code', { length: 100 }).notNull().unique(),
    /** 权限名称（显示用） */
    name: varchar('name', { length: 100 }).notNull(),
    /** 权限类型：menu / button / api */
    type: varchar('type', { length: 20 }).notNull().default('api'),
    /** 父权限 ID（树形结构） */
    parentId: text('parent_id'),
    /** 排序 */
    orderIndex: integer('order_index').notNull().default(0),
    /** 权限描述 */
    description: text('description'),
    /** 是否启用 */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('sys_permission_type_idx').on(table.type), index('sys_permission_parent_idx').on(table.parentId)],
);

// ==================== 角色-权限关联表 ====================

/** 角色权限关联（多对多） */
export const sysRolePermission = pgTable(
  'sys_role_permission',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => sysRole.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => sysPermission.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('sys_role_permission_unique').on(table.roleId, table.permissionId),
    index('sys_role_permission_role_idx').on(table.roleId),
    index('sys_role_permission_perm_idx').on(table.permissionId),
  ],
);

// ==================== 用户-角色关联表 ====================

/**
 * 用户角色关联
 *
 * 支持系统级角色和项目级角色：
 * - projectId 为 null 时表示系统级角色
 * - projectId 不为 null 时表示项目内的角色
 */
export const sysUserRole = pgTable(
  'sys_user_role',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => sysRole.id, { onDelete: 'cascade' }),
    /** 项目 ID（null = 系统级角色） */
    projectId: text('project_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('sys_user_role_unique').on(table.userId, table.roleId, table.projectId),
    index('sys_user_role_user_idx').on(table.userId),
    index('sys_user_role_role_idx').on(table.roleId),
    index('sys_user_role_project_idx').on(table.projectId),
  ],
);

// ==================== 关系定义 ====================

export const sysRoleRelations = relations(sysRole, ({ many }) => ({
  permissions: many(sysRolePermission),
  userRoles: many(sysUserRole),
}));

export const sysPermissionRelations = relations(sysPermission, ({ one, many }) => ({
  parent: one(sysPermission, {
    fields: [sysPermission.parentId],
    references: [sysPermission.id],
    relationName: 'permissionTree',
  }),
  children: many(sysPermission, { relationName: 'permissionTree' }),
  rolePermissions: many(sysRolePermission),
}));

export const sysRolePermissionRelations = relations(sysRolePermission, ({ one }) => ({
  role: one(sysRole, {
    fields: [sysRolePermission.roleId],
    references: [sysRole.id],
  }),
  permission: one(sysPermission, {
    fields: [sysRolePermission.permissionId],
    references: [sysPermission.id],
  }),
}));

export const sysUserRoleRelations = relations(sysUserRole, ({ one }) => ({
  user: one(user, {
    fields: [sysUserRole.userId],
    references: [user.id],
  }),
  role: one(sysRole, {
    fields: [sysUserRole.roleId],
    references: [sysRole.id],
  }),
}));
