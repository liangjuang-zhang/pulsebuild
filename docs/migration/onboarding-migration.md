# Onboarding 迁移总结

## 迁移日期
2026-04-14

## 迁移范围
从 `C:\projects\pulsebuild-projects\pulsebuild-app` 迁移 Onboarding 流程到 `c:\projects\pulsebuild\apps\mobile`

## 架构变更

### 数据库
- **旧项目**: expo-sqlite + token-store
- **新项目**: WatermelonDB + Better Auth session

### 认证
- **旧项目**: Zustand auth-store
- **新项目**: Better Auth (cookie-based)

### API
- **旧项目**: 自定义 auth-api
- **新项目**: trpc client

## 迁移文件清单

### Phase 1: WatermelonDB 架构
| 文件 | 说明 |
|------|------|
| `lib/database/schema.ts` | WatermelonDB schema 定义 |
| `lib/database/models/User.ts` | User 模型 (WatermelonDB decorators) |
| `lib/database/models/Project.ts` | Project 模型 |
| `lib/database/models/Task.ts` | Task 模型 |
| `lib/database/models/index.ts` | Models 导出 |
| `lib/database/database.ts` | 数据库初始化 (SQLiteAdapter) |
| `lib/database/user-repository.ts` | User CRUD 操作 |
| `lib/database/index.ts` | Database 模块导出 |

### Phase 2: Onboarding 服务层
| 文件 | 说明 |
|------|------|
| `lib/types/user.ts` | PersonalInfoData, OnboardingStepConfig 类型 |
| `lib/types/onboarding.ts` | OnboardingState, OnboardingFlowVariant 类型 |
| `lib/services/onboarding-storage.ts` | KV 存储 (expo-sqlite/kv-store) |
| `lib/services/onboarding-service.ts` | Onboarding 业务逻辑 (Better Auth + WatermelonDB) |
| `lib/services/online-access.ts` | 网络连接检测服务 |
| `stores/onboarding-store.ts` | Zustand store (简化版) |

### Phase 3: Onboarding 组件
| 文件 | 说明 |
|------|------|
| `components/common/online-required-notice.tsx` | 网络提示组件 |
| `components/common/confirmation-dialog.tsx` | 确认对话框 |
| `components/onboarding/progress-indicator.tsx` | 进度指示器 |
| `components/onboarding/onboarding-layout.tsx` | Onboarding 布局组件 |
| `components/onboarding/feature-highlight.tsx` | 功能高亮卡片 |
| `components/onboarding/profile-photo-uploader.tsx` | 头像上传组件 |

### Phase 4: Hooks 和验证
| 文件 | 说明 |
|------|------|
| `hooks/use-onboarding-progress.ts` | 步骤进度 hook |
| `hooks/use-online-access.ts` | 网络状态 hook |
| `lib/validation/onboarding-validation.ts` | 表单验证逻辑 |

### Phase 5: Onboarding 页面
| 文件 | 步骤 | 说明 |
|------|------|------|
| `app/(onboarding)/_layout.tsx` | Layout | Onboarding 路由组布局 |
| `app/(onboarding)/personal-info.tsx` | Step 1 | 用户信息收集 |
| `app/(onboarding)/profile-photo.tsx` | Step 2 | 头像上传 |
| `app/(onboarding)/notifications.tsx` | Step 3 | 通知权限 |
| `app/(onboarding)/welcome.tsx` | Step 4 | 完成引导 |

## 新增依赖
- `zustand` - 状态管理
- `expo-image-picker` - 图片选择

## 适配说明

### Better Auth 集成
- 使用 `authClient.useSession()` 替代 `useAuthStore`
- 使用 `authClient.updateUser()` 更新用户信息
- Cookie-based authentication, 无需 token 管理

### WatermelonDB 集成
- 使用 `userRepository.saveUserProfile()` 替代 expo-sqlite 直接操作
- 支持离线优先架构
- 使用 decorators (@field, @date, @writer)

### trpc 集成
- 使用 `trpc` client 进行 API 调用
- 目前后端无 onboarding procedure, 使用 placeholder

## 待完成项
1. 后端 trpc onboarding procedure 创建
2. Push notification service 集成
3. Onboarding 路由保护逻辑
4. E2E 测试

## 文件行数统计
所有迁移文件均控制在 300 行以内,符合规范要求。