import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Better Auth 核心表 - 用户表（已扩展）
 */
export const user = pgTable(
  'user',
  {
    // Better Auth 核心字段
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    phoneNumber: varchar('phone_number', { length: 255 }).unique(),
    phoneNumberVerified: boolean('phone_number_verified'),
    // 扩展字段
    countryCode: varchar('country_code', { length: 8 }),
    timezone: varchar('timezone', { length: 64 }),
    jobTitle: varchar('job_title', { length: 120 }),
    companyName: varchar('company_name', { length: 120 }),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    notificationsEnabled: boolean('notifications_enabled').default(false).notNull(),
    onboardingCompletedAt: timestamp('onboarding_completed_at'),
    /** JSON 数组: 引导跳过的步骤编号，如 [2, 3] */
    onboardingSkippedSteps: text('onboarding_skipped_steps'),
    deletedAt: timestamp('deleted_at'),
    lastLoginAt: timestamp('last_login_at'),
    // Sync tracking field (for WatermelonDB sync)
    lastModified: timestamp('last_modified', { precision: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // 手机号唯一索引（国家区号 + 手机号组合唯一）
    uniqueIndex('user_phone_unique').on(table.countryCode, table.phoneNumber),
    index('user_status_idx').on(table.status),
  ],
);

/**
 * Better Auth 核心表 - 会话表
 */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
);

/**
 * Better Auth 核心表 - 账户表（OAuth/密码登录）
 */
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
);

/**
 * Better Auth 核心表 - 验证码表
 */
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

/**
 * Better Auth 表关系
 */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
