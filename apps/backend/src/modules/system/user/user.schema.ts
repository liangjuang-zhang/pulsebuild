import { z } from 'zod';

// ==================== Onboarding 联系方式校验 ====================

/** 校验联系方式唯一性输入 */
export const ValidateContactInputSchema = z.object({
  /** 当前用户 ID（排除自身） */
  userId: z.string().min(1),
  /** 手机号（E.164 格式） */
  phoneNumber: z.string().max(20).optional(),
  /** 邮箱 */
  email: z.email().max(100).optional(),
});
export type ValidateContactInput = z.infer<typeof ValidateContactInputSchema>;

/** 校验联系方式唯一性结果 */
export const ValidateContactResultSchema = z.object({
  available: z.boolean(),
  /** 冲突的字段名 */
  conflicts: z.array(z.enum(['email', 'phoneNumber'])),
});
export type ValidateContactResult = z.infer<typeof ValidateContactResultSchema>;

// ==================== 用户-角色分配 ====================

/** 分配用户角色 */
export const AssignUserRoleInputSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  projectId: z.string().nullable().optional(),
});
export type AssignUserRoleInput = z.infer<typeof AssignUserRoleInputSchema>;

/** 移除用户角色 */
export const RemoveUserRoleInputSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  projectId: z.string().nullable().optional(),
});
export type RemoveUserRoleInput = z.infer<typeof RemoveUserRoleInputSchema>;

/** 查询用户角色 */
export const UserRoleQueryInputSchema = z.object({
  userId: z.string().min(1),
  projectId: z.string().nullable().optional(),
});
export type UserRoleQueryInput = z.infer<typeof UserRoleQueryInputSchema>;

// ==================== 用户角色信息 ====================

/** 用户角色信息 */
export const UserRoleInfoSchema = z.object({
  roleId: z.string(),
  roleCode: z.string(),
  roleName: z.string(),
  roleLevel: z.number(),
  projectId: z.string().nullable(),
});
export type UserRoleInfo = z.infer<typeof UserRoleInfoSchema>;

/** 用户权限码列表 */
export const UserPermissionsResultSchema = z.object({
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});
export type UserPermissionsResult = z.infer<typeof UserPermissionsResultSchema>;
