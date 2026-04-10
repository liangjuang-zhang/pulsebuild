# 步骤 01：数据库 Schema 迁移

## 概述

将旧项目 28+ 数据表迁移到新项目，同时优化表结构、合并冗余表、与 Better Auth schema 对齐。

## 旧项目数据表清单

### 核心表（必须迁移）
| 表名 | 用途 | 迁移策略 |
|------|------|----------|
| `users` | 用户信息 | ✅ 已迁移到 Better Auth `user` 表，需补充扩展字段 |
| `projects` | 项目/工地 | 新建 schema |
| `project_members` | 项目成员 | 新建 schema |
| `tasks` | 任务/工作项 | 新建 schema |
| `subtasks` | 子任务 | 新建 schema |
| `defects` | 缺陷/问题 | 新建 schema |
| `locations` | 项目地址 | 合并到 projects 表 |

### 状态/类型表（合并优化）
| 原表名 | 优化方案 |
|--------|----------|
| `project_statuses` | → 合并到 `status_types` |
| `statuses` (任务状态) | → 合并到 `status_types` |
| `defect_statuses` | → 合并到 `status_types` |
| `defect_severities` | → 合并到 `status_types` |
| `severities` | → 合并到 `status_types` |
| `task_types` | → 合并到 `status_types` 或独立枚举 |
| `user_types` | → Better Auth roles/permissions 或 `status_types` |
| `project_types` | → 合并到 `status_types` |

### 业务表（二期迁移）
| 表名 | 用途 | 优先级 |
|------|------|--------|
| `task_updates` | 任务状态变更记录 | 中 |
| `task_dependencies` | 任务依赖关系 | 中 |
| `defect_updates` | 缺陷状态变更 | 中 |
| `timesheets` | 工时记录 | 中 |
| `projectTimesheetSettings` | 工时配置 | 低 |
| `attendance_records` | 考勤记录 | 中 |
| `siteDiaries` | 工地日志 | 中 |
| `siteDiaryVisitors` | 日志访客 | 低 |

### 媒体/文件表
| 表名 | 用途 | 优先级 |
|------|------|--------|
| `attachments` | 文件附件 | 中 |
| `photos` | 照片 | 中 |
| `mediaAttachments` | 媒体关联 | 低（可合并） |

### 社交/通讯表
| 表名 | 用途 | 优先级 |
|------|------|--------|
| `notifications` | 通知 | 中 |
| `messages` | 消息 | 低 |
| `connections` | 用户关系 | 低 |
| `connectionRequests` | 连接请求 | 低 |
| `relationships` | 社交关系 | 低 |
| `pushInstallations` | 推送设备 | 低 |

### 系统/审计表
| 表名 | 用途 | 优先级 |
|------|------|--------|
| `syncTombstones` | 同步已删除记录 | 取决于离线方案 |
| `blacklistedTokens` | Token 黑名单 | ❌ Better Auth 内置 session 管理 |
| `loginCodes` | 登录验证码 | ❌ Better Auth verification 表替代 |
| `availability` | 用户可用时间 | 低 |
| `user_blocks` | 用户封锁 | 低 |

## 优化设计

### 1. 统一状态表 `status_types`

替代旧项目 5+ 个状态表：

```typescript
export const statusTypes = pgTable('status_types', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),     // 'project' | 'task' | 'defect'
  category: varchar('category', { length: 50 }).notNull(), // 'status' | 'severity' | 'type'
  name: varchar('name', { length: 50 }).notNull(),      // 显示名
  value: varchar('value', { length: 50 }).notNull(),     // 枚举值
  orderIndex: integer('order_index').default(0),
  color: varchar('color', { length: 20 }),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 2. 项目表 `projects`（合并 locations）

```typescript
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  ownerId: text('owner_id').references(() => user.id),
  statusId: integer('status_id').references(() => statusTypes.id),
  typeId: integer('type_id').references(() => statusTypes.id),
  // 地址（合并自 locations 表）
  street: varchar('street', { length: 255 }),
  suburb: varchar('suburb', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postcode: varchar('postcode', { length: 20 }),
  country: varchar('country', { length: 100 }),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  // 时间
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 3. 任务表 `tasks`

```typescript
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 300 }).notNull(),
  description: text('description'),
  assignedToId: text('assigned_to_id').references(() => user.id),
  statusId: integer('status_id').references(() => statusTypes.id),
  typeId: integer('type_id').references(() => statusTypes.id),
  priority: integer('priority').default(0),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 4. 不迁移的表（Better Auth 已覆盖）

| 旧表 | 替代方案 |
|------|----------|
| `blacklistedTokens` | Better Auth `session` 表 + revoke API |
| `loginCodes` | Better Auth `verification` 表 |
| 手动 email 验证字段 | Better Auth `emailVerified` + verification plugin |

---

## Claude Code 提示词

```
你是 PulseBuild 项目的后端架构师。当前项目路径: C:\projects\pulsebuild

参考旧项目数据库 schema: C:\projects\pulsebuild-projects\pulsebuild-service\drizzle\schema.ts

## 任务

在 `apps/backend/src/database/` 目录下创建以下 Drizzle schema 文件：

### 1. `status-types.schema.ts`
创建统一状态类型表 `status_types`，替代旧项目的 project_statuses、statuses、defect_statuses、defect_severities、severities 等多个状态表。
字段：id, type ('project'|'task'|'defect'), category ('status'|'severity'|'type'), name, value, orderIndex, color, isDefault, isActive, createdAt
添加 (type, category, value) 唯一索引。

### 2. `projects.schema.ts`
创建项目表 `projects`，合并旧项目的 projects 和 locations 表。
字段：id, uuid, name, description, ownerId (FK → user.id), statusId (FK → status_types.id), typeId (FK → status_types.id), street, suburb, state, postcode, country, latitude, longitude, startDate, endDate, deletedAt, createdAt, updatedAt
添加必要索引。

### 3. `tasks.schema.ts`
创建任务表 `tasks` 和子任务表 `subtasks`。
tasks 字段：id, uuid, projectId (FK → projects.id CASCADE), name, description, assignedToId (FK → user.id), statusId, typeId, priority, dueDate, completedAt, deletedAt, createdAt, updatedAt
subtasks 字段：id, uuid, taskId (FK → tasks.id CASCADE), name, description, statusId, assignedToId, completedAt, deletedAt, createdAt, updatedAt

### 4. `defects.schema.ts`
创建缺陷表 `defects`，合并旧项目的 defects 表。
字段：id, uuid, projectId (FK), taskId (FK, 可选), reportedById (FK → user.id), assignedToId (FK → user.id), title, description, statusId, severityId, deletedAt, createdAt, updatedAt

### 5. `project-members.schema.ts`
创建项目成员表 `project_members`。
字段：id, projectId (FK → projects.id CASCADE), userId (FK → user.id), role (varchar - 'owner'|'manager'|'supervisor'|'worker'), joinedAt, removedAt, createdAt, updatedAt
添加 (projectId, userId) 唯一约束。

### 6. 更新 `database/index.ts`
导出所有新 schema 文件。

## 规范要求
- 使用 Drizzle ORM pgTable 语法
- 主键使用 serial（自增），辅以 uuid 作为公开标识
- 所有外键引用 Better Auth user 表使用 text 类型 (user.id 是 text)
- 软删除使用 deletedAt 字段
- 时间字段使用 timestamp with timezone
- 导出 tables 和 relations
- 遵循现有 auth.schema.ts 的编码风格
```

---

## 需要你确认的事项

1. **统一状态表** vs 保留独立状态表？
2. **locations 合并到 projects** 还是保持独立表？
3. **uuid 字段**：是否每个表都需要 uuid 作为公开 API 标识符？
4. **哪些业务表可以延后迁移？** （参考上面的优先级标注）
5. **旧数据是否需要迁移？** 还是只迁移 schema 从零开始？
