import { z } from 'zod';

// ==================== 角色信息 ====================

export const RoleSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  level: z.number(),
  isActive: z.boolean(),
  isBuiltin: z.boolean(),
  createdAt: z.date(),
});
export type Role = z.infer<typeof RoleSchema>;

/** 角色（含权限列表） */
export const RoleWithPermissionsSchema = RoleSchema.extend({
  permissions: z.array(z.object({ id: z.string(), code: z.string(), name: z.string() })),
});
export type RoleWithPermissions = z.infer<typeof RoleWithPermissionsSchema>;

// ==================== 角色输入 ====================

/** 创建角色 */
export const CreateRoleInputSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, '角色编码只允许小写字母、数字、下划线'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['system', 'project']).default('project'),
  level: z.number().int().min(0).max(999).default(100),
});
export type CreateRoleInput = z.infer<typeof CreateRoleInputSchema>;

/** 更新角色 */
export const UpdateRoleInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  level: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;

/** 删除角色 */
export const DeleteRoleInputSchema = z.object({
  id: z.string().min(1),
});
export type DeleteRoleInput = z.infer<typeof DeleteRoleInputSchema>;

/** 角色查询 */
export const RoleQueryInputSchema = z.object({
  type: z.enum(['system', 'project']).optional(),
  isActive: z.boolean().optional(),
});
export type RoleQueryInput = z.infer<typeof RoleQueryInputSchema>;

// ==================== 角色-权限分配 ====================

/** 角色权限分配 */
export const AssignPermissionsInputSchema = z.object({
  roleId: z.string().min(1),
  permissionIds: z.array(z.string().min(1)),
});
export type AssignPermissionsInput = z.infer<typeof AssignPermissionsInputSchema>;
