import { z } from 'zod';

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
