/**
 * Database Schema 统一导出
 *
 * 所有 schema 文件在此统一管理，便于：
 * 1. Drizzle CLI 识别（drizzle.config.ts 指向此目录）
 * 2. 跨模块 relations 定义
 * 3. 统一导入路径
 */

// Auth 模块 schema
export * from './auth.schema';

// TODO: 添加其他模块 schema
// export * from './system.schema';
// export * from './user.schema';
