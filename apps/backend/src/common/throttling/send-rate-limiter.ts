import { Injectable, Logger } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * 内存级发送限流器
 *
 * 用于邮件/短信等外部服务的独立业务级别限流，
 * 防止单个目标在短时间内被大量发送请求轰炸。
 *
 * 按目标地址（邮箱或手机号）限制实际发送频率。
 */
@Injectable()
export class SendRateLimiter {
  private readonly logger = new Logger(SendRateLimiter.name);
  private readonly store = new Map<string, RateLimitEntry>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor() {
    // 每 5 分钟清理过期条目
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
  }

  /**
   * 检查并消费一次发送配额
   *
   * @param channel - 通道标识（如 'email', 'sms'）
   * @param target - 目标地址（邮箱或手机号）
   * @param maxAttempts - 窗口期内最大发送次数
   * @param windowMs - 窗口期时长（毫秒）
   * @returns true 表示允许发送，false 表示已超限
   */
  consume(channel: string, target: string, maxAttempts: number, windowMs: number): boolean {
    const key = `${channel}:${target}`;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (entry.count >= maxAttempts) {
      this.logger.warn(`Rate limit exceeded: ${channel} -> ${target} (${entry.count}/${maxAttempts} in ${windowMs}ms)`);
      return false;
    }

    entry.count += 1;
    return true;
  }

  /**
   * 获取剩余配额
   */
  remaining(channel: string, target: string, maxAttempts: number): number {
    const key = `${channel}:${target}`;
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) return maxAttempts;
    return Math.max(0, maxAttempts - entry.count);
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (now >= entry.resetAt) {
        this.store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`Cleaned up ${removed} expired rate limit entries`);
    }
  }
}
