import { Query, Router } from 'nestjs-trpc';
import { z } from 'zod';

@Router({ alias: 'health' })
export class HealthRouter {
  @Query({ output: z.object({ status: z.string(), timestamp: z.number() }) })
  check(): { status: string; timestamp: number } {
    return { status: 'ok', timestamp: Date.now() };
  }
}
