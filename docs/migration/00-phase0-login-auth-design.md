# Phase 0: 登录鉴权基础功能迁移方案

> **创建日期**: 2026-04-10
> **状态**: 待确认后实施
> **依赖**: 用户确认的关键决策已记录

---

## 一、确认的架构决策

基于用户确认，以下决策作为迁移设计的基准：

| 决策项 | 选择 | 说明 |
|--------|------|------|
| **认证方式** | 手机号登录 (后期可扩展 OAuth) | Better Auth phone plugin + Twilio SMS |
| **短信服务商** | Twilio | 保留旧项目配置，国际化短信 |
| **用户 ID 策略** | 纯 text ID | 所有表统一使用 text ID，与 Better Auth 完全一致 |
| **数据迁移策略** | 新 schema + 旧数据 seed | 创建新数据库设计，使用旧数据作为 seed |
| **OAuth 提供商** | 仅手机号（后期按需添加） | 先实现手机号登录 |
| **Session 策略** | 长 Session (7天) | 适合移动端 APP 场景，Better Auth 默认支持 |
| **权限模型** | RBAC（后期） | 登录鉴权阶段无全局角色，按项目成员角色判断 |
| **迁移顺序** | 核心模块优先 | 登录 → 用户 → 项目 → 任务 → 缺陷 |

---

## 二、Phase 1: 登录鉴权实现

### 2.1 后端实现步骤

#### Step 1: 配置 Twilio SMS 服务

**目标**: 集成 Twilio 到 Better Auth phone plugin

**文件变更**:
```
apps/backend/
├── src/modules/auth/
│   ├── auth.ts              # 修改: 集成 Twilio sendOTP
│   └── auth.config.ts       # 新增: Twilio 配置提取
├── .env.example             # 修改: 添加 Twilio 配置变量
└── package.json             # 检查: twilio 依赖
```

**实现要点**:
1. 从环境变量读取 Twilio 配置 (ACCOUNT_SID, AUTH_TOKEN, FROM_NUMBER)
2. 实现 `sendOTP` 函数调用 Twilio API
3. 开发环境使用 console.log 替代实际发送
4. 保留旧项目的验证码格式: `Your PulseBuild verification code is {code}. It expires in 15 minutes.`
5. 验证码长度: 6 位，有效期: 5 分钟（Better Auth 默认）

**参考旧项目代码**:
- `C:\projects\pulsebuild-projects\pulsebuild-service\src\auth\sms.service.ts`

#### Step 2: 配置 Better Auth Session

**目标**: 配置长 Session 策略

**配置项**:
```typescript
// apps/backend/src/modules/auth/auth.ts
export function createAuth(database: NodePgDatabase) {
  return betterAuth({
    // ... 其他配置
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 天
      updateAge: 60 * 60 * 24,     // 每天更新一次
      cookieCache: {
        expiresIn: 60 * 5,         // 5 分钟缓存
      },
    },
  });
}
```

#### Step 3: 创建用户 tRPC Router

**目标**: 实现用户 CRUD tRPC 路由

**文件变更**:
```
apps/backend/src/modules/user/
├── user.router.ts    # 新增: tRPC 路由
├── user.service.ts   # 新增: 业务逻辑
├── user.schema.ts    # 新增: Zod schema
└── user.module.ts    # 新增: NestJS module
```

**API 设计**:
| 方法 | tRPC 路由 | 输入 | 输出 | 说明 |
|------|-----------|------|------|------|
| query | `user.me` | - | User | 获取当前登录用户 |
| query | `user.getById` | `{ id: string }` | User | 按 ID 获取用户 |
| query | `user.list` | Pagination | User[] | 分页获取用户列表 |
| mutation | `user.updateProfile` | UpdateInput | User | 更新用户信息 |
| mutation | `user.updateStatus` | `{ status: string }` | User | 更新用户状态 |

**Zod Schema 参考**:
```typescript
// user.schema.ts
import { z } from 'zod';

export const userOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  countryCode: z.string().nullable(),
  image: z.string().nullable(),
  timezone: z.string().nullable(),
  jobTitle: z.string().nullable(),
  companyName: z.string().nullable(),
  status: z.enum(['active', 'suspended', 'pending']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  timezone: z.string().optional(),
  jobTitle: z.string().max(120).optional(),
  companyName: z.string().max(120).optional(),
  image: z.string().url().optional(),
});
```

#### Step 4: 注册模块到 AppModule

**目标**: 将 UserModule 注册到 NestJS

**修改文件**:
- `apps/backend/src/app.module.ts`

---

### 2.2 移动端实现步骤

#### Step 1: 创建认证 Provider

**目标**: 在移动端集成 Better Auth client

**文件变更**:
```
apps/mobile/src/
├── lib/auth/
│   ├── auth-client.ts    # 新增: Better Auth client 初始化
│   └── auth-provider.tsx # 新增: React Context Provider
│   └── use-auth.ts       # 新增: 认证 hook
├── types/
│   └── user.ts           # 新增: 用户类型定义
└── app/
    └── (auth)/
        └── login.tsx     # 新增: 登录页面
        └── verify.tsx    # 新增: 验证码页面
```

**Better Auth Client 配置**:
```typescript
// lib/auth/auth-client.ts
import { createAuthClient } from 'better-auth/auth-client';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
});

// 手机号登录 API
export const phoneAuth = {
  sendOTP: (phone: string) => authClient.phoneNumber.sendOTP({ phoneNumber: phone }),
  verifyOTP: (phone: string, code: string) => authClient.phoneNumber.verifyPhoneNumber({
    phoneNumber: phone,
    code,
  }),
  getSession: () => authClient.getSession(),
  signOut: () => authClient.signOut(),
};
```

#### Step 2: 实现登录页面

**目标**: 创建手机号输入 + 验证码登录流程

**页面设计**:
1. **登录页面** (`login.tsx`):
   - 输入国家区号 + 手机号
   - 点击"发送验证码"按钮
   - 跳转到验证码页面

2. **验证码页面** (`verify.tsx`):
   - 显示手机号
   - 输入 6 位验证码
   - 验证成功后跳转到首页
   - 支持重新发送验证码（60秒冷却）

#### Step 3: 配置 Auth Provider

**目标**: 全局认证状态管理

**Provider 功能**:
- 自动检查 session 状态
- 未登录时跳转到登录页
- 已登录时提供用户信息

---

## 三、Phase 2-5: 核心模块迁移顺序

### Phase 2: 项目模块 (projects)

**依赖**: Phase 1 完成

**实现内容**:
1. 创建 `projects.schema.ts` - 项目表设计
2. 创建 `project.router.ts` - 项目 CRUD tRPC 路由
3. 创建 `project.service.ts` - 项目业务逻辑
4. 创建 `project-member.router.ts` - 项目成员管理

**数据库表设计**:
- `projects` - 项目表（合并 locations）
- `status_types` - 统一状态表（项目状态）

**参考旧项目**:
- `pulsebuild-service/src/projects/projects.controller.ts`
- `pulsebuild-service/src/projects/projects.service.ts`
- `pulsebuild-service/drizzle/migrations/schema.ts` (projects 表)

### Phase 3: 任务模块 (tasks)

**依赖**: Phase 2 完成

**实现内容**:
1. 创建 `tasks.schema.ts` - 任务表设计
2. 创建 `task.router.ts` - 任务 CRUD
3. 创建 `subtask.router.ts` - 子任务 CRUD

**数据库表设计**:
- `tasks` - 任务表
- `subtasks` - 子任务表

### Phase 4: 缺陷模块 (defects)

**依赖**: Phase 3 完成

**实现内容**:
1. 创建 `defects.schema.ts` - 缺陷表设计
2. 创建 `defect.router.ts` - 缺陷 CRUD
3. 创建 `defect-update.router.ts` - 缺陷状态变更记录

### Phase 5: 辅助模块

**依赖**: Phase 4 完成

**实现内容**:
- `status-type.router.ts` - 状态类型查询
- `media-attachment.router.ts` - 媒体附件管理
- `notification.router.ts` - 通知管理

---

## 四、数据库 Schema 设计

### 4.1 新设计原则

1. **主键**: 全部使用 text ID（与 Better Auth user.id 完全统一）
2. **外键**: 所有外键使用 text 类型
3. **软删除**: 所有业务表添加 `deletedAt` 字段
4. **审计字段**: `createdAt`, `updatedAt` 标准化
5. **状态管理**: 统一 `status_types` 表替代多个状态表
6. **ID 生成**: 使用 `nanoid` 或 Better Auth 内置 ID 生成器

### 4.2 表结构调整示例

**旧项目 projects 表**:
```typescript
// 旧: 自增 ID + UUID
id: serial().primaryKey(),
uuid: uuid().unique(),
ownerId: integer('owner_id'), // 自增 ID
```

**新设计 projects 表**:
```typescript
// 新: 纯 text ID
id: text('id').primaryKey().$defaultFn(() => nanoid()),
name: varchar('name', { length: 200 }).notNull(),
ownerId: text('owner_id').notNull().references(() => user.id), // text ID
description: text('description'),
statusId: text('status_id').references(() => statusTypes.id),
// ... 其他字段
deletedAt: timestamp('deleted_at'),
createdAt: timestamp('created_at').defaultNow(),
updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
```

### 4.3 旧数据 Seed 策略

**目标**: 使用旧项目数据作为 seed，适应新 schema

**ID 转换规则**:
| 旧字段 | 新字段 | 转换方式 |
|--------|--------|----------|
| `users.id` (serial) | `user.id` (text) | 使用 `users.uuid` 转换为 text 作为新 ID |
| `users.uuid` | `user.id` (text) | 直接使用 uuid 字符串作为新 text ID |
| `projects.id` (serial) | `projects.id` (text) | 使用 `projects.uuid` 或生成新 nanoid |
| `projects.ownerId` (integer) | `projects.ownerId` (text) | 查询 users.uuid 映射到新 user.id |

**Seed 实现要点**:

1. 建立 ID 映射表: `{ oldSerialId: newTextId }`
2. 处理外键关系时使用映射表转换
3. 保持数据完整性约束

**Seed 文件结构**:
```
apps/backend/src/database/seeds/
├── id-mapping.ts         # ID 映射辅助函数
├── users.seed.ts         # 用户数据
├── projects.seed.ts      # 项目数据
├── tasks.seed.ts         # 任务数据
├── status-types.seed.ts  # 状态类型数据
└── seed-runner.ts        # Seed 执行器
```

---

## 五、风险与注意事项

### 5.1 高风险项

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| **ID 类型变更** | text ID 与旧项目 integer/uuid 不兼容 | Seed 时使用 uuid 转换为新 text ID |
| **Better Auth 限制** | Better Auth 对 schema 有特定要求 | 保持在 user 表添加 additionalFields |
| **Session 同步** | 移动端需要同步 session 状态 | 使用 TanStack Query 缓存 session |

### 5.2 中风险项

| 集成项 | 说明 | 缓解措施 |
|--------|------|----------|
| Twilio 账号 | 需要有效的 Twilio 账号配置 | 开发环境使用 mock 发送 |
| tRPC 移动端集成 | Expo + tRPC 需要额外适配 | 使用 expo-trpc-client 或 fetch |
| 状态表合并 | 多个状态表合并为统一表 | 保持迁移前后数据一致 |

---

## 六、下一步行动

**等待确认后执行**:

1. ✅ 确认登录鉴权设计是否符合预期
2. ✅ 确认数据库 schema 设计方向
3. 🔄 开始实现 Phase 1 Step 1 (Twilio 集成)

---

## 七、附录: 旧项目参考文件路径

| 功能 | 旧项目路径 |
|------|------------|
| SMS 服务 | `pulsebuild-service/src/auth/sms.service.ts` |
| JWT 策略 | `pulsebuild-service/src/auth/strategies/jwt.strategy.ts` |
| Auth DTO | `pulsebuild-service/src/auth/dto/auth.dto.ts` |
| 用户表 Schema | `pulsebuild-service/drizzle/migrations/schema.ts` |
| 认证文档 | `pulsebuild-service/docs/AUTHENTICATION_GUIDE.md` |