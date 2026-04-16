/**
 * 权限中间件 - tRPC RBAC 校验
 *
 * 在 AuthMiddleware 之后执行，从 procedure meta 中读取权限要求，
 * 查询用户权限并校验是否满足。
 *
 * 执行顺序：
 *   AppContext.create() → AuthMiddleware → PermissionMiddleware → Handler
 *
 * 使用方式：
 *   @Query({ input: ..., output: ..., meta: { permissions: ['system.user.list'] } })
 *   async list() {}
 *
 * 校验逻辑：
 *   - 权限：用户必须拥有全部所需权限（AND）
 *   - 角色：用户需满足任一所需角色（OR）
 */
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TRPCMiddleware, MiddlewareOptions, MiddlewareResponse } from 'nestjs-trpc';
import { UserService } from '../system/user/user.service';
import type { AuthenticatedContext } from './auth.middleware';

/** tRPC procedure meta 中的权限配置 */
interface PermissionMeta {
  /** 所需权限码列表（AND 逻辑） */
  permissions?: string[];
  /** 所需角色码列表（OR 逻辑） */
  roles?: string[];
}

@Injectable()
export class PermissionMiddleware implements TRPCMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(opts: MiddlewareOptions<AuthenticatedContext, Record<string, unknown>, PermissionMeta>): MiddlewareResponse {
    const meta = opts.meta;
    const requiredPermissions = meta?.permissions;
    const requiredRoles = meta?.roles;

    // 无权限要求，直接放行
    if ((!requiredPermissions || requiredPermissions.length === 0) && (!requiredRoles || requiredRoles.length === 0)) {
      return opts.next();
    }

    // 从 context 中获取 userId（由 AuthMiddleware 注入）
    const userId = opts.ctx.userId;

    if (!userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: '未登录或会话已过期',
      });
    }

    // 从请求中提取 projectId（用于项目级权限）
    const projectId = this.extractProjectId(opts.input);

    // 查询用户权限
    const identity = await this.userService.getUserPermissions(userId, projectId);

    // 权限校验：必须拥有全部所需权限（AND）
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) => identity.permissions.includes(permission));
      if (!hasAllPermissions) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '权限不足',
        });
      }
    }

    // 角色校验：满足任一所需角色即可（OR）
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAnyRole = requiredRoles.some((role) => identity.roles.includes(role));
      if (!hasAnyRole) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '角色不匹配',
        });
      }
    }

    return opts.next();
  }

  /** 从请求载荷中提取 projectId */
  private extractProjectId(payload: unknown): string | null {
    return this.findProjectId(payload, 0);
  }

  /**
   * 递归搜索对象中的 projectId 字段
   * 最大递归深度为 4 层，防止处理超大嵌套对象
   */
  private findProjectId(payload: unknown, depth: number): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    if (depth > 4) {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const rawProjectId = record.projectId;
    if (typeof rawProjectId === 'string' && rawProjectId.length > 0) {
      return rawProjectId;
    }

    // 当前层未找到，继续向下递归搜索
    for (const value of Object.values(record)) {
      const nested = this.findProjectId(value, depth + 1);
      if (nested) {
        return nested;
      }
    }

    return null;
  }
}
