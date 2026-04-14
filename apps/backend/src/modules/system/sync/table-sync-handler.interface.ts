/**
 * 表同步处理器接口
 *
 * 实现此接口以支持新表的 WatermelonDB 同步
 * 所有同步逻辑通过此接口抽象，实现可复用
 */

/**
 * 表变更结构
 */
export interface TableChanges {
  created: Record<string, string | number | boolean | null>[];
  updated: Record<string, string | number | boolean | null>[];
  deleted: string[];
}

/**
 * 表同步处理器接口
 *
 * 使用具体类型而非泛型，便于注册和调用
 */
export interface TableSyncHandler {
  /** 表名称（WatermelonDB 客户端使用） */
  tableName: string;

  /**
   * 查询变更记录
   *
   * @param db 数据库连接
   * @param scope 查询范围（如 userId，用于限定查询范围）
   * @param lastPulledAt 上次同步时间戳，null 表示首次同步
   * @returns 表变更数据
   */
  queryChanges(db: unknown, scope: { userId: string }, lastPulledAt: number | null): Promise<TableChanges>;

  /**
   * 应用变更到数据库
   *
   * @param tx 数据库事务
   * @param changes 表变更数据
   * @param scope 查询范围
   * @param lastPulledAt 上次同步时间戳（用于冲突检测）
   */
  applyChanges(tx: unknown, changes: TableChanges, scope: { userId: string }, lastPulledAt: number): Promise<void>;
}
