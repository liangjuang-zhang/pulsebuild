import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS_KEY, ROLES_KEY } from './permission.decorator';
import { UserService } from '../user/user.service';
import type { AuthInstance } from '../../auth/auth';

/** AuthGuard 挂载到 request 上的会话类型 */
type SessionData = UserSession<AuthInstance>;

/**
 * 权限守卫（全局）
 *
 * 在 Better Auth 的 AuthGuard 之后执行，读取其挂载到 request 上的 session 数据。
 * 配合 @RequirePermissions / @RequireRoles 装饰器使用。
 *
 * 执行流程：
 *   AuthGuard（认证） → PermissionGuard（授权）
 *
 * - 无装饰器的路由自动放行
 * - 权限校验：要求用户拥有**全部**所需权限码（AND 逻辑）
 * - 角色校验：要求用户拥有**任一**所需角色（OR 逻辑）
 * - 支持从 body / query 中自动提取 projectId，实现项目级权限查询
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 从路由方法和控制器类上读取 @RequirePermissions / @RequireRoles 元数据
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    // 未标记任何权限/角色要求的路由，直接放行
    if ((!requiredPermissions || requiredPermissions.length === 0) && (!requiredRoles || requiredRoles.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ session?: SessionData; body?: unknown; query?: unknown }>();

    // 从 Better Auth 的 AuthGuard 挂载的 session 中提取用户 ID
    const userId = request.session?.user?.id;
    if (!userId) {
      throw new UnauthorizedException('未登录或会话失效');
    }

    // 尝试从请求 body/query 中提取 projectId（用于项目级权限查询）
    const projectId = this.extractProjectId(request.body) ?? this.extractProjectId(request.query) ?? null;

    // 查询用户在该项目下的实际角色和权限列表（基于自定义 RBAC 表）
    const identity = await this.userService.getUserPermissions(userId, projectId);

    // 权限校验：必须拥有全部所需权限（AND）
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) => identity.permissions.includes(permission));
      if (!hasAllPermissions) {
        throw new ForbiddenException('权限不足');
      }
    }

    // 角色校验：满足任一所需角色即可（OR）
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAnyRole = requiredRoles.some((role) => identity.roles.includes(role));
      if (!hasAnyRole) {
        throw new ForbiddenException('角色不匹配');
      }
    }

    return true;
  }

  /** 从请求载荷中提取 projectId */
  private extractProjectId(payload: unknown): string | undefined {
    return this.findProjectId(payload, 0);
  }

  /**
   * 递归搜索对象中的 projectId 字段
   * 最大递归深度为 4 层，防止处理超大嵌套对象
   */
  private findProjectId(payload: unknown, depth: number): string | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }
    if (depth > 4) {
      return undefined;
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

    return undefined;
  }
}
