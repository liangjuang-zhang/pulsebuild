# WatermelonDB Components 集成分析

> 创建日期: 2026-04-14
> 参考: https://watermelondb.dev/docs/Components

---

## 一、当前项目状态

### 1.1 现有模式

| 方面 | 当前实现 | WatermelonDB 官方建议 |
|------|----------|----------------------|
| 数据访问 | Repository 模式（imperative） | Observable 模式（reactive） |
| React 集成 | 无 | `withObservables` + `useDatabase` |
| Provider | 无 DatabaseProvider | 需要 DatabaseProvider 包裹 |
| 数据刷新 | 手动调用 API | 自动响应式更新 |

### 1.2 当前文件分析

```
src/lib/database/
├── database.ts          # 数据库实例
├── user-repository.ts   # Imperative 查询（无 observe）
├── sync-manager.ts      # 同步逻辑
├── models/
│   ├── User.ts          # Model 定义（有 @writer 装饰器）
│   ├── Project.ts       # Model 定义
│   └── Task.ts          # Model 定义
```

**关键发现**:
- Models 已正确使用 `@writer` 装饰器（支持同步）
- Repository 使用 `.fetch()` 而非 `.observe()`（无响应式）
- `_layout.tsx` 未包裹 `DatabaseProvider`

---

## 二、WatermelonDB Components 用途

### 2.1 核心组件

| 组件 | 用途 | 使用场景 |
|------|------|----------|
| `DatabaseProvider` | 提供数据库上下文 | App 根布局 |
| `useDatabase` | Hook 获取数据库 | 组件内直接使用 |
| `withObservables` | 观察数据变化自动重渲染 | 列表、详情页 |
| `withDatabase` | 注入 database prop | 配合 Provider |

### 2.2 响应式 vs 非响应式对比

```typescript
// ❌ 当前方式：非响应式，需要手动刷新
const users = await database.get('users').query().fetch();

// ✅ WatermelonDB 方式：响应式，数据变化自动更新 UI
const enhance = withObservables([], ({ database }) => ({
  users: database.get('users').query().observe(),
}));
```

---

## 三、项目中应使用的位置

### 3.1 高优先级集成点

| 文件 | 组件 | 用途 |
|------|------|------|
| `app/_layout.tsx` | `DatabaseProvider` | 包裹根布局，提供数据库上下文 |
| 任务列表页（待创建） | `withObservables` | 观察 tasks 列表变化 |
| 项目列表页（待创建） | `withObservables` | 观察 projects 列表变化 |
| 用户详情页（待创建） | `withObservables` | 观察单个 user 变化 |

### 3.2 `_layout.tsx` 集成方案

```typescript
// app/_layout.tsx
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { database } from '@/lib/database';

function RootLayoutContent() {
  // ... existing logic
  
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider database={database}>  {/* ← 新增 */}
          <PaperProvider theme={paperTheme}>
            <BottomSheetProvider>
              <ToastProvider>
                <ThemeProvider value={navTheme}>
                  <Slot />
                </ThemeProvider>
              </ToastProvider>
            </BottomSheetProvider>
          </PaperProvider>
        </DatabaseProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 3.3 列表页组件示例（待迁移时使用）

```typescript
// components/task-list.tsx
import { withObservables, useDatabase } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';

interface TaskListProps {
  tasks: Task[];
  database: Database;
}

function TaskList({ tasks }: TaskListProps) {
  const database = useDatabase();
  
  const handleCreateTask = async () => {
    await database.write(async () => {
      await database.get('tasks').create((t) => {
        t.title = 'New Task';
        t.status = 'pending';
      });
    });
  };
  
  return (
    <FlatList
      data={tasks}
      renderItem={({ item }) => <TaskItem task={item} />}
    />
  );
}

// 响应式观察：tasks 变化自动重渲染
const enhance = withObservables(['projectId'], ({ projectId, database }) => ({
  tasks: database
    .get('tasks')
    .query(Q.where('project_id', projectId), Q.where('deleted_at', null))
    .observe(),
}));

export default enhance(TaskList);
```

### 3.4 关联数据观察示例

```typescript
// components/project-detail.tsx
import { withObservables } from '@nozbe/watermelondb/react';

interface ProjectDetailProps {
  project: Project;
  tasks: Task[];
  owner: User;
}

function ProjectDetail({ project, tasks, owner }: ProjectDetailProps) {
  return (
    <View>
      <Text>{project.name}</Text>
      <Text>Owner: {owner.name}</Text>
      <Text>Tasks: {tasks.length}</Text>
    </View>
  );
}

// 观察 project + 关联 tasks + 关联 owner
const enhance = withObservables(['project'], ({ project }) => ({
  project,
  tasks: project.tasks.observe(),       // @relation 在 Model 中定义
  owner: project.owner.observe(),       // 自动响应关联变化
}));

export default enhance(ProjectDetail);
```

---

## 四、Repository 模式保留建议

### 4.1 两种模式共存

| 场景 | 使用模式 | 原因 |
|------|----------|------|
| UI 列表/详情展示 | `withObservables` | 响应式自动更新 |
|一次性查询/写入 | Repository | 简单直接 |
| Sync 操作 | Repository | 批量操作 |
| 非组件逻辑 | Repository | Hooks 不可用 |

### 4.2 建议架构

```
src/lib/database/
├── database.ts           # 数据库实例
├── user-repository.ts    # 保留（用于非响应式场景）
├── sync-manager.ts       # 同步逻辑
├── models/
│   ├── User.ts           # Model 定义
│   ├── Project.ts        # Model 定义
│   └── Task.ts           # Model 定义

src/hooks/
├── use-user-observable.ts  # 新增：响应式用户数据 hook
├── use-tasks-observable.ts # 新增：响应式任务列表 hook
```

---

## 五、迁移决策点

| # | 决策项 | 选项 | 建议 |
|---|--------|------|------|
| 1 | 是否添加 `DatabaseProvider` 到 `_layout.tsx`？ | A: 立即添加 / B: 迁移页面时添加 | **A**（低风险，为后续做准备） |
| 2 | Repository 是否保留？ | A: 完全替换 / B: 共存 | **B**（不同场景各有优势） |
| 3 | 是否创建响应式 hooks？ | A: 封装 hooks / B: 直接用 withObservables | **A**（更易复用） |
| 4 | 何时迁移页面组件？ | A: 现在 / B: 迁移旧项目时 | **B**（跟随页面迁移节奏） |

---

## 六、下一步行动

### Phase 1（立即执行）

1. 在 `_layout.tsx` 添加 `DatabaseProvider`
2. 创建 `hooks/use-database.ts` 导出 `useDatabase`

### Phase 2（页面迁移时）

1. 为每个列表页创建响应式 hook
2. 使用 `withObservables` 观察数据变化
3. 关联数据通过 Model relations 自动响应

---

## 七、参考代码位置

| 当前文件 | 状态 |
|----------|------|
| [app/_layout.tsx](../apps/mobile/src/app/_layout.tsx) | 需添加 DatabaseProvider |
| [lib/database/user-repository.ts](../apps/mobile/src/lib/database/user-repository.ts) | 保留（非响应式场景） |
| [lib/database/models/Task.ts](../apps/mobile/src/lib/database/models/Task.ts) | 已有 @relation 定义 |

---

## 八、WatermelonDB 官方示例

```typescript
// 观察计数
const enhance = withObservables(['post'], ({ post }) => ({
  post,
  commentCount: post.comments.observeCount(),
}));

// 组合多个 HOC
import { compose } from '@nozbe/watermelondb/react';

export default compose(
  withDatabase,
  withObservables(['projectId'], ({ projectId, database }) => ({
    project: database.get('projects').find(projectId).observe(),
  })),
)(ProjectDetail);
```