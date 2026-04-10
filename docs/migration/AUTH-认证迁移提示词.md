# 认证迁移 - Claude Code 分步提示词

> 从旧项目自定义 JWT + Twilio SMS 迁移到 Better Auth + Expo 集成方案
> 参考文档: https://better-auth.com/docs/integrations/expo

---

## 第一步：后端 - 添加 Expo 插件 + 配置 trustedOrigins

### 提示词

```
你是 PulseBuild 项目的后端开发者。项目路径: C:\projects\pulsebuild

## 背景
当前后端已集成 Better Auth + Phone Number 插件 (见 apps/backend/src/modules/auth/auth.ts)。
需要添加 @better-auth/expo 服务端插件，支持 Expo 移动端认证。

参考官方文档: https://better-auth.com/docs/integrations/expo

## 任务

### 1. 安装服务端依赖
在 apps/backend 目录下安装:
pnpm --filter backend add @better-auth/expo

### 2. 更新 auth.ts 添加 Expo 插件

修改 apps/backend/src/modules/auth/auth.ts:
- 导入 expo from "@better-auth/expo"
- 在 plugins 数组中添加 expo() 插件
- 添加 trustedOrigins 配置:
  - "pulsebuild://" (生产 scheme)
  - 开发模式下额外添加 "exp://" 和 "exp://192.168.*.*:*/**" 通配符
- 添加 emailAndPassword: { enabled: true } (可选，后期邮箱登录用)

最终 auth.ts 应类似:
```typescript
import { expo } from "@better-auth/expo";

export function createAuth(database: NodePgDatabase) {
  return betterAuth({
    database: drizzleAdapter(database, { provider: 'pg', schema }),
    trustedOrigins: [
      "pulsebuild://",
      ...(process.env.NODE_ENV === "development" ? [
        "exp://",
        "exp://**",
        "exp://192.168.*.*:*/**",
      ] : []),
    ],
    user: { additionalFields: { ... } }, // 保持现有扩展字段
    plugins: [
      expo(),
      phoneNumber({ ... }), // 保持现有 phoneNumber 配置
    ],
  });
}
```

### 3. 确保 CORS 配置
如果 main.ts 中有 CORS 配置，确保允许 Expo 开发服务器的请求。
当前 main.ts 使用 bodyParser: false，这是正确的。
如果缺少 CORS，添加:
app.enableCors({
  origin: true, // 开发阶段允许所有来源
  credentials: true,
});

### 4. 更新 app.json scheme (移动端)
确认 apps/mobile/app.json 中的 scheme 为 "pulsebuild"（当前是 "mobile"，需要改为 "pulsebuild"）。

## 规范
- 不要删除现有的 phoneNumber 插件和 user additionalFields 配置
- trustedOrigins 的开发模式通配符仅在 NODE_ENV=development 时启用
- 生产环境只信任 "pulsebuild://" scheme
```

---

## 第二步：移动端 - 创建 Better Auth 客户端

### 提示词

```
你是 PulseBuild 项目的移动端开发者。项目路径: C:\projects\pulsebuild

## 背景
后端已配置好 Better Auth + Expo 插件 + Phone Number 插件。
现在需要在移动端 (apps/mobile) 配置 Better Auth 客户端。

参考官方文档: https://better-auth.com/docs/integrations/expo
参考旧项目认证 API: C:\projects\pulsebuild-projects\pulsebuild-app\lib\services\auth-api.ts

## 任务

### 1. 安装客户端依赖
在 apps/mobile 目录下:
pnpm --filter mobile add better-auth @better-auth/expo expo-secure-store expo-network

### 2. 创建 auth-client.ts

创建 apps/mobile/src/lib/auth-client.ts:

```typescript
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL!, // 后端 URL
  plugins: [
    expoClient({
      scheme: "pulsebuild",
      storagePrefix: "pulsebuild",
      storage: SecureStore,
    }),
    phoneNumberClient(),
  ],
});

// 导出类型化的 hooks
export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;
```

要点:
- baseURL 使用 EXPO_PUBLIC_API_URL 环境变量（已存在于当前项目）
- scheme 必须与 app.json 和后端 trustedOrigins 一致: "pulsebuild"
- storagePrefix 用 "pulsebuild" 避免 cookie 冲突
- 导入并注册 phoneNumberClient 插件用于手机号登录

### 3. 更新 tRPC 客户端以携带认证 Cookie

修改 apps/mobile/src/app/_layout.tsx 中的 trpcClient 配置:

在 httpBatchLink 的 headers 中注入 Better Auth cookie:

```typescript
import { authClient } from "@/lib/auth-client";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.EXPO_PUBLIC_API_URL}/trpc`,
      headers() {
        const headers: Record<string, string> = {};
        const cookies = authClient.getCookie();
        if (cookies) {
          headers["Cookie"] = cookies;
        }
        return headers;
      },
    }),
  ],
});
```

这是 Better Auth Expo 集成的关键: 
- authClient.getCookie() 从 SecureStore 获取 session cookie
- 手动附加到 tRPC 请求头（因为 React Native 不支持自动 cookie）
- credentials 设为 "omit" 避免干扰手动设置的 cookie（httpBatchLink 默认已处理）

### 4. 创建 .env.local 示例（如不存在）
确保 apps/mobile/ 下有 .env 或者 .env.local:
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000   （替换为实际 IP）

## 规范
- 不使用 expo-secure-store 的默认导入，使用 * as SecureStore 命名空间导入
- phoneNumberClient 必须从 "better-auth/client/plugins" 导入
- 不要创建任何 Zustand store 来管理认证状态，完全使用 authClient.useSession()
```

---

## 第三步：移动端 - 认证页面 (手机号登录)

### 提示词

```
你是 PulseBuild 项目的移动端开发者。项目路径: C:\projects\pulsebuild

## 背景
Better Auth 客户端已配置完成 (apps/mobile/src/lib/auth-client.ts)。
现在创建手机号登录认证页面。

参考旧项目 UI 和交互逻辑:
- 手机号输入页: C:\projects\pulsebuild-projects\pulsebuild-app\app\(auth)\phone-entry.tsx
- 验证码页: C:\projects\pulsebuild-projects\pulsebuild-app\app\(auth)\code-verification.tsx
- 旧认证布局: C:\projects\pulsebuild-projects\pulsebuild-app\app\(auth)\_layout.tsx

## 任务

### 1. 创建认证路由组

创建 apps/mobile/src/app/(auth)/_layout.tsx:
- Stack 导航器
- headerShown: false
- 包含 phone-entry 和 code-verification 两个 Screen
- gestureEnabled: false（防止手势返回跳过认证）

```typescript
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="phone-entry" />
      <Stack.Screen name="code-verification" />
    </Stack>
  );
}
```

### 2. 创建手机号输入页

创建 apps/mobile/src/app/(auth)/phone-entry.tsx:
- 参考旧 app 的 phone-entry.tsx UI 布局
- 使用 React Native Paper 组件 (TextInput, Button, Text)
- 手机号输入框带国家区号选择（先简化为固定 +61 或 +86）
- 点击"发送验证码"调用:
  ```typescript
  const { data, error } = await authClient.phoneNumber.sendOtp({
    phoneNumber: fullPhoneNumber, // 含国家区号，如 "+86138xxxx"
  });
  ```
- 发送成功后跳转到 code-verification 页，传递手机号参数:
  ```typescript
  router.push({ pathname: "/(auth)/code-verification", params: { phone: fullPhoneNumber } });
  ```
- 处理错误状态、loading 状态
- 手机号格式验证（E.164 格式）

UI 布局（参考旧 app 简化版）:
- 标题: "输入手机号"
- 副标题: "我们将发送验证码到你的手机"
- 区号选择 + 手机号输入框
- "发送验证码" 按钮
- loading 时按钮禁用

### 3. 创建验证码输入页

创建 apps/mobile/src/app/(auth)/code-verification.tsx:
- 从路由参数获取手机号: useLocalSearchParams()
- 6 位验证码输入
- 调用 Better Auth 验证:
  ```typescript
  const { data, error } = await authClient.phoneNumber.verify({
    phoneNumber: phone,
    code: code,
  });
  ```
- 验证成功后导航到主页:
  ```typescript
  router.replace("/(app)/(tabs)/projects");
  ```
- 重发验证码按钮 + 60 秒倒计时
- 处理错误（验证码错误、过期、超过尝试次数）
- loading 状态

UI 布局:
- 标题: "输入验证码"
- 副标题: "验证码已发送到 {phone}"
- 6 位 OTP 输入框（可单独输入框或单个 TextInput）
- "验证" 按钮
- "重新发送" 链接 + 倒计时

### 4. 创建已认证路由组骨架

创建 apps/mobile/src/app/(app)/_layout.tsx:
- 暂时简单的 Stack 布局
- 后续会改为 Tab 布局

创建 apps/mobile/src/app/(app)/(tabs)/projects.tsx:
- 暂时显示 "项目列表" 占位文本
- 显示当前用户信息 (authClient.useSession())
- 退出登录按钮

### 5. 更新根布局 - 认证路由守卫

修改 apps/mobile/src/app/_layout.tsx:
- 使用 authClient.useSession() 判断认证状态
- 未认证 → 显示 (auth) 路由组
- 已认证 → 显示 (app) 路由组
- 加载中 → 显示 loading

```typescript
import { authClient } from "@/lib/auth-client";

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          {isPending ? (
            <LoadingScreen />
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              {session ? (
                <Stack.Screen name="(app)" />
              ) : (
                <Stack.Screen name="(auth)" />
              )}
            </Stack>
          )}
        </PaperProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

注意: Better Auth Expo 客户端会自动从 SecureStore 恢复 session，
所以 app 重启时 isPending 会短暂为 true，之后自动恢复已登录状态。
不需要像旧 app 那样手动 hydrateSession()。

## 规范
- 所有认证操作通过 authClient，不创建额外的 auth service 或 store
- 使用 React Native Paper 的 TextInput, Button, ActivityIndicator 组件
- 手机号使用 E.164 国际格式 (如 +8613812345678)
- 验证码倒计时使用 useState + useEffect，不引入额外库
- 错误消息在 UI 中显示，不使用 Alert
- 页面组件保持简洁，不超过 200 行
- 不要迁移旧 app 的 Zustand auth-store，不需要了
- 不要迁移旧 app 的 session-manager.ts，Better Auth 自动管理
```

---

## 第四步：端到端验证 + 调试

### 提示词

```
你是 PulseBuild 项目的全栈开发者。项目路径: C:\projects\pulsebuild

## 背景
Better Auth Expo 认证流程已搭建完成:
- 后端: Better Auth + Expo 插件 + Phone Number 插件
- 移动端: Better Auth 客户端 + 手机号登录页面

## 任务: 端到端验证

### 1. 验证后端 auth 端点
启动后端: cd apps/backend && pnpm dev
验证以下端点可访问:
- GET http://localhost:3000/api/auth/ok → { "status": "ok" }
- 查看控制台是否有 Better Auth 初始化日志

### 2. 创建开发用 seed 数据（可选）
如果 phoneNumber 插件的 sendOTP 是 console.log，则验证码会打印在后端控制台。
确认这个 console.log 在开发环境正常工作。

### 3. 验证移动端
启动移动端: cd apps/mobile && pnpm start
- 输入手机号 → 点击发送验证码
- 查看后端控制台获取验证码
- 输入验证码 → 验证
- 验证成功后应跳转到 (app) 路由
- 关闭 app 重新打开 → 应自动恢复登录状态 (SecureStore 缓存)

### 4. 验证 tRPC 认证请求
在 projects 页面调用 trpc.health.check.useQuery()
确认请求头中包含 Cookie（Better Auth session cookie）

### 5. 常见问题排查

问题: "CSRF token missing"
→ 检查 trustedOrigins 是否包含 exp:// 开发 scheme

问题: session 为 null
→ 检查 expoClient 的 storage 是否正确传入 SecureStore
→ 检查 baseURL 是否是完整 URL（含协议 http://）

问题: tRPC 请求 401
→ 检查 httpBatchLink headers 是否正确注入了 authClient.getCookie()
→ 确认 credentials 不是 "include"（会干扰手动 cookie）

问题: Metro bundler 模块解析错误
→ Expo SDK 55 默认支持 package exports，一般不需要额外配置
→ 如果有问题，清理缓存: npx expo start --clear
```

---

## 迁移对照表

| 旧项目组件 | 新项目替代 | 说明 |
|-----------|-----------|------|
| `stores/auth-store.ts` (17 个状态) | `authClient.useSession()` | Better Auth 自动管理 session |
| `lib/services/auth-api.ts` (5 个函数) | `authClient.phoneNumber.sendOtp/verify` | 内置 API |
| `lib/services/session-manager.ts` | `@better-auth/expo` SecureStore | 自动存储 |
| `lib/services/fresh-install-auth-guard.ts` | 不需要 | Better Auth 自动处理 |
| `lib/services/mobile-verification.ts` | 不需要 | 内置 |
| `stores/auth.ts` | 不需要 | 废弃 |
| `hooks/use-auth-user.ts` | `authClient.useSession()` | 内置 hook |
| 手动 JWT token 管理 | Cookie-based session | 自动 |
| 手动 token refresh | Better Auth session 自动续期 | 自动 |
| token 黑名单表 | Better Auth session revoke | 内置 |

## 精简掉的代码量

| 旧项目文件 | 行数 | 状态 |
|-----------|------|------|
| auth-store.ts | ~400 行 | ❌ 不需要 |
| auth-api.ts | ~300 行 | ❌ 不需要 |
| session-manager.ts | ~250 行 | ❌ 不需要 |
| mobile-verification.ts | ~150 行 | ❌ 不需要 |
| fresh-install-auth-guard.ts | ~80 行 | ❌ 不需要 |
| auth.ts (旧 store) | ~100 行 | ❌ 不需要 |
| use-auth-user.ts | ~50 行 | ❌ 不需要 |
| **合计** | **~1,330 行** | 全部由 Better Auth 替代 |
