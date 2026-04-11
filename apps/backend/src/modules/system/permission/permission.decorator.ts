import { SetMetadata } from '@nestjs/common';

/** 权限守卫元数据 key */
export const PERMISSIONS_KEY = 'permissions';

/**
 * 权限装饰器
 *
 * 标记路由所需权限编码，与权限守卫配合使用。
 * 用法：@RequirePermissions('project:create', 'project:update')
 */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/** 角色守卫元数据 key */
export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 *
 * 标记路由所需角色编码。
 * 用法：@RequireRoles('admin', 'builder')
 */
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
