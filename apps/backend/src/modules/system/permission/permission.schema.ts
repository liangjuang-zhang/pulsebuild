import { z } from 'zod';

// ==================== 权限信息 ====================

export const PermissionSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: z.string(),
  parentId: z.string().nullable(),
  orderIndex: z.number(),
  description: z.string().nullable(),
  isActive: z.boolean(),
});
export type Permission = z.infer<typeof PermissionSchema>;

/** 权限树节点 */
export const PermissionTreeNodeSchema: z.ZodType<Permission & { children: unknown[] }> = PermissionSchema.extend({
  children: z.lazy(() => z.array(PermissionTreeNodeSchema)),
});
export type PermissionTreeNode = z.infer<typeof PermissionTreeNodeSchema>;

// ==================== 权限输入 ====================

/** 创建权限 */
export const CreatePermissionInputSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z][a-z0-9:_]*$/, '权限编码只允许小写字母、数字、冒号、下划线'),
  name: z.string().min(1).max(100),
  type: z.enum(['menu', 'button', 'api']).default('api'),
  parentId: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0).default(0),
  description: z.string().max(500).optional(),
});
export type CreatePermissionInput = z.infer<typeof CreatePermissionInputSchema>;

/** 更新权限 */
export const UpdatePermissionInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['menu', 'button', 'api']).optional(),
  parentId: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionInputSchema>;

/** 删除权限 */
export const DeletePermissionInputSchema = z.object({
  id: z.string().min(1),
});
export type DeletePermissionInput = z.infer<typeof DeletePermissionInputSchema>;
