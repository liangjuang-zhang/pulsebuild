/**
 * Vanilla tRPC Client（非 React 环境使用）
 *
 * 供 sync-manager 等非组件代码调用 tRPC 接口。
 * 自动注入 Better Auth cookie。
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/trpc/server';
import { authClient } from '@/lib/auth-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export const trpcVanilla = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers() {
        const headers: Record<string, string> = {};
        const cookies = authClient.getCookie();
        if (cookies) {
          headers['Cookie'] = cookies;
        }
        return headers;
      },
    }),
  ],
});
