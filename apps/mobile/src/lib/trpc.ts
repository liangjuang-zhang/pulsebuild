import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@repo/trpc/server';

export const trpc = createTRPCReact<AppRouter>();
