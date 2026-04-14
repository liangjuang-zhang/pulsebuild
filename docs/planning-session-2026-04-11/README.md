# Agent 会话文档索引

> 会话日期：2026-04-11
> 会话主题：移动端页面迁移规划（离线优先架构方案B）

---

## 一、会话概要

### 讨论主题

从源项目 `C:\projects\pulsebuild-projects` 迁移 app 端界面和 service 端业务到当前项目 `c:\projects\pulsebuild` 的 mobile 目录。

### 关键决策

1. **架构方案选择**：方案B - WatermelonDB 统一架构
   - Model + withObservations + synchronize()
   - 离线业务数据由 WatermelonDB 管理
   - 非离线数据保留 TanStack Query + tRPC

2. **迁移顺序**：
   - 先迁移基础设施（多语言、监控、主题）
   - 再迁移页面功能，反向推导数据需求

3. **界面一致性要求**：
   - 多语言系统与源项目一致
   - 主题/样式与源项目一致
   - 监控系统与源项目一致

---

## 二、文档列表

### 核心决策文档

| 文档 | 描述 | 状态 |
|------|------|------|
| [09-离线架构方案对比-方案A.md](09-离线架构方案对比-方案A.md) | 双层数据架构（Zustand + expo-sqlite + SyncEngine） | ✅ 已完成 |
| [10-离线架构方案对比-方案B.md](10-离线架构方案对比-方案B.md) | WatermelonDB 统一架构（Model + synchronize） | ✅ 已完成 |
| [11-移动端页面迁移规划.md](11-移动端页面迁移规划.md) | 页面迁移详细规划，包含 Phase 0-7 | ✅ 已完成 |

### 参考文档（旧规划）

位于 `docs/migration/` 目录：

| 文档 | 描述 |
|------|------|
| 00-迁移总览.md | 旧迁移总览 |
| 01-数据库Schema迁移.md | Drizzle Schema 迁移规划 |
| 02-后端核心模块迁移.md | 后端核心模块规划 |
| 03-后端业务模块迁移.md | 后端业务模块规划 |
| 04-移动端基础架构迁移.md | 认证部分已完成 |
| 05-移动端核心页面迁移.md | 页面迁移规划 |
| 06-离线同步方案设计.md | 离线同步设计 |
| 07-第三方服务集成.md | 第三方服务集成 |
| 08-移动端辅助功能迁移.md | 辅助功能迁移 |

---

## 三、源项目分析结果

### 移动端页面结构

| 分类 | 页面数量 | 核心页面 |
|------|---------|----------|
| P0 认证流程 | 5 | ✅ 已完成 |
| P1 主应用核心 | 5 | 项目详情 **2400 行** |
| P2 任务管理 | 4 | 任务详情 **1300 行** |
| P3 入职流程 | 5 | 非离线数据 |
| P4 连接/分包商 | 4 | 相对独立 |
| P5 设置页面 | 6 | 非离线数据 |
| P6 考勤/工时 | 2 | 需离线支持 |

### 基础设施分析

| 功能 | 源项目文件 | 迁移优先级 |
|------|-----------|-----------|
| 多语言 | `constants/locales/*.json` | P0.1 |
| 主题 | `constants/theme.ts, ui.ts` | P0.2 |
| 监控 | `lib/monitoring/sentry.ts, posthog.ts` | P0.3 |
| Toast | `components/toast.tsx` | P0.4 |
| 实时翻译 | `lib/services/realtime-translation-*.ts` | P0.5（可选） |

### WatermelonDB Model 需求

| Model | 优先级 | 使用页面 |
|-------|--------|---------|
| Project | P1 | 项目列表/详情 |
| Task | P2 | 任务管理 |
| Subtask | P2 | 子任务 |
| Defect | P1/P2 | 缺陷管理 |
| ProjectMember | P1 | 项目团队 |
| Attachment | P1/P2 | 文档附件 |
| SiteDiary | P1 | 现场日志 |
| Connection | P4 | 连接列表 |
| Subcontractor | P4 | 分包商 |
| Timesheet | P6 | 工时记录 |
| Availability | P4 | 可用性日历 |
| TaskDependency | P2 | 任务依赖 |

---

## 四、迁移阶段规划

```
Phase 0: 基础设施迁移（第 1 周）⭐ 最优先
├── 0.1 多语言系统
├── 0.2 主题/样式系统
├── 0.3 监控系统 (Sentry + PostHog)
├── 0.4 Toast 通知系统
├── 0.5 实时翻译功能（可选）
└── 0.6 环境变量配置

Phase 1: WatermelonDB 基础框架（第 2 周）
├── 1.1 安装 WatermelonDB 依赖
├── 1.2 初始化 Database 实例
├── 1.3 实现 sync.pull/push endpoint
├── 1.4 实现 synchronize() 函数
└── 1.5 验证同步流程

Phase 2: 项目列表页面迁移（第 3 周）
├── 2.1 Project Model 定义
├── 2.2 sync endpoint 扩展
├── 2.3 projects.tsx 页面迁移
└── 2.4 create.tsx 创建页面迁移

Phase 3-7: 其他页面迁移（第 4-10 周）
```

---

## 五、下一步待确认

当前等待确认的迁移步骤：

**Phase 0.1: 多语言系统迁移**

```
Step 1: 安装 i18next + react-i18next + expo-localization
Step 2: 复制语言文件 (en.json, zh.json, en-GB.json)
Step 3: 创建 i18n.ts 配置文件
Step 4: 创建 language-storage.ts 服务
Step 5: 在 _layout.tsx 中初始化
Step 6: 验证语言切换功能
```

---

## 六、会话关键讨论记录

### 1. 状态管理方案讨论

问题：状态管理 + 本地存储是否应该合并考虑？

结论：是的，因为离线场景下两者紧密耦合。

方案对比：
- 方案A：Zustand + expo-sqlite + 手动 SyncEngine
- 方案B：WatermelonDB + withObservations + synchronize()

选择：方案B

### 2. tRPC/TanStack Query 角色讨论

问题：方案B中 tRPC 和 TanStack Query 的作用？

结论：
- 离线业务数据 → WatermelonDB 管理（替代 TanStack Query）
- 非离线数据 → TanStack Query + tRPC（保留）
- sync endpoint → tRPC 提供（新增）

### 3. 实时订阅概念解释

概念：`useObservation(query)` = 数据变化 → UI 自动刷新

类比：
- 类似 TanStack Query 的自动刷新，但监听的是本地 SQLite
- 类似 Firebase 的 onSnapshot()

### 4. 迁移顺序讨论

问题：应该从数据表开始还是从页面开始？

结论：从页面功能出发，反向推导数据需求。但需要先迁移基础设施保证界面一致性。

---

## 七、后续会话指引

下次会话开始时，可以参考：

1. **本文档**：了解整体规划和决策
2. **11-移动端页面迁移规划.md**：了解具体迁移步骤
3. **10-离线架构方案对比-方案B.md**：了解 WatermelonDB 架构细节

开始迁移时：
```
请继续迁移 Phase 0.1: 多语言系统
参考文档：docs/planning-session-2026-04-11/11-移动端页面迁移规划.md
```