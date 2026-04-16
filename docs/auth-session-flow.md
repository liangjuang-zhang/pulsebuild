# 认证会话流程执行顺序

## 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    _layout.tsx                           │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │ useAuthSession() │    │ useAuthSessionSync()       │  │
│  │ (读 store)       │    │ (写 store)                 │  │
│  └────────┬────────┘    └────────────┬───────────────┘  │
│           │                          │                   │
│           ▼                          ▼                   │
│  isHydrating?              ┌─────────────────────┐      │
│  ├─ true  → Loading        │ ① 读本地快照         │      │
│  └─ false → <Slot />       │ ② 获取远端 session   │      │
│                            │ ③ 刷新本地快照       │      │
│                            │ ④ 清除过期快照       │      │
│                            │ ⑤ 写 Zustand store   │      │
│                            └─────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 相关文件

| 文件 | 职责 |
|------|------|
| `src/stores/auth-session-store.ts` | Zustand store 定义 + `useAuthSessionSync` + `useAuthSession` |
| `src/app/_layout.tsx` | 根布局，调用 sync hook，根据 `isHydrating` 决定 UI |
| `src/lib/auth-client.ts` | Better Auth 客户端实例 |
| `src/lib/services/auth-session-snapshot.ts` | 本地快照读写（AsyncStorage） |
| `src/hooks/use-network-status.ts` | 网络状态监听 |

## 第一层：入口

`_layout.tsx` 的 `RootLayoutContent` 组件挂载时做两件事：

```
RootLayoutContent 首次渲染
  ├── useAuthSession()        ← 从 Zustand store 读状态（初始值 isHydrating=true）
  └── useAuthSessionSync()    ← 启动同步逻辑（写 store）
```

因为初始 `isHydrating = true`，`_layout.tsx` 直接 return `<LoadingState />`，**不渲染子路由**。

## 第二层：useAuthSessionSync 内部 effect 执行顺序

React 在首次渲染后，同一轮 commit 的 effect 按声明顺序同步执行：

```
┌─ 渲染完成，进入 effect 阶段 ─────────────────────────────────┐
│                                                                │
│  effect ①  读本地快照（异步）                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ getAuthSessionSnapshot()  ──→  setSnapshot(...)          │  │
│  │                               setIsSnapshotReady(true)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  effect ②  获取远端 session（异步）                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ isConnected?                                             │  │
│  │  ├─ NO  → setIsRemoteDone(true)        ← 离线，直接完成  │  │
│  │  └─ YES → authClient.getSession()                        │  │
│  │            ├─ 成功 → setRemoteUser(user)                 │  │
│  │            │         setIsRemoteDone(true)                │  │
│  │            └─ 失败 → setRemoteUser(null)  ← 后端不可达   │  │
│  │                      setIsRemoteDone(true)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  effect ⑤  写 store（每次依赖变化都执行）                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 初次: isSnapshotReady=false → isHydrating=true           │  │
│  │       store 值没变 → setStateFromSource 守卫跳过          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## 第三层：异步回调触发的后续渲染

① 和 ② 是**并行的异步操作**，谁先完成谁先触发 re-render：

```
时间线 ──────────────────────────────────────────────────────→

T0  首次渲染
    store: { isHydrating: true, session: null }
    UI: <LoadingState />

T1  ① 快照读完（通常几 ms）
    setSnapshot({user: {id:'xxx',...}})
    setIsSnapshotReady(true)
    ↓ 触发 effect ⑤ 重新计算：
    isHydrating = !true || (!false && !true) = false  ← 有快照兜底，不再等远端
    session = { user: snapshot.user }
    isOfflineSession = true
    ↓ store 更新 → _layout 重新渲染
    UI: <Slot />  ← 用户看到页面了！

T2  ② 远端返回（可能几百 ms ~ 超时）
```

### 场景 A：后端正常，返回用户

```
┌────────────────────────────────────────┐
│ setRemoteUser(remoteUser)              │
│ setIsRemoteDone(true)                  │
│ ↓ 触发 effect ③：刷新本地快照          │
│ ↓ 触发 effect ⑤：                      │
│   session = { user: remoteUser }       │
│   isOfflineSession = false             │
└────────────────────────────────────────┘
```

### 场景 B：后端不可达（有网络但服务未启动）

```
┌────────────────────────────────────────┐
│ catch → setRemoteUser(null)            │
│          setIsRemoteDone(true)         │
│ ↓ 触发 effect ⑤：                      │
│   session 还是 snapshot.user ← 没变    │
│   isOfflineSession = true  ← 没变      │
│   store 守卫检测到值没变 → 跳过更新     │
│   UI 不刷新，继续正常使用               │
└────────────────────────────────────────┘
```

### 场景 C：离线（无网络）

```
┌────────────────────────────────────────┐
│ isConnected=false → 不发请求           │
│ setIsRemoteDone(true)                  │
│ 同场景 B，用 snapshot 兜底             │
└────────────────────────────────────────┘
```

### 场景 D：在线 + 后端正常 + 但无 session（已登出）

```
┌────────────────────────────────────────┐
│ remoteUser = null, isRemoteDone = true │
│ ↓ 触发 effect ④：清除本地快照          │
│ ↓ 触发 effect ⑤：                      │
│   session = null                       │
│   isHydrating = false                  │
│   → UI 跳转到登录页                    │
└────────────────────────────────────────┘
```

### 场景 E：首次安装（无本地快照）

```
┌────────────────────────────────────────┐
│ T1: ① 快照读完 → snapshot = null       │
│     isSnapshotReady = true             │
│     但 isRemoteDone = false            │
│     没有 snapshot 兜底                  │
│     isHydrating = !true || (!false && !false) = false  ← 无快照也不等远端？
│                                        │
│     实际: !isSnapshotReady=false        │
│           !isRemoteDone=true            │
│           !snapshot?.user=true          │
│     → isHydrating = false || (true && true) = true  ← 继续等远端
│                                        │
│ T2: ② 远端返回                         │
│     ├─ 有 session → session=user       │
│     └─ 无 session → session=null → 登录│
│     isRemoteDone=true                  │
│     isHydrating = false                │
└────────────────────────────────────────┘
```

## 第四层：数据消费

```
Zustand Store (单一数据源)
    │
    ├── _layout.tsx          useAuthSession() → isHydrating 控制显示 Loading 还是 <Slot/>
    │                                         → session 控制 analytics 用户标识
    │
    ├── welcome.tsx          useAuthSession() → session.user.name 显示欢迎名
    │
    └── personal-info.tsx    useAuthSession() → session.user.phoneNumber 预填手机号
```

## 防重入机制

| 层级 | 机制 | 作用 |
|------|------|------|
| Store `setStateFromSource` | 逐字段比较守卫 | 值没变不 `set()`，不通知订阅者 |
| `useAuthSession` | `useShallow` | 返回对象浅比较，属性没变不 re-render |
| `fetchRemoteSession` | `try/catch` + `setIsRemoteDone(true)` | 后端不可达也能结束等待 |
| `mountedRef` | 组件卸载标记 | 防止异步回调写已卸载组件的状态 |

## isHydrating 计算逻辑

```typescript
isHydrating = !isSnapshotReady || (!isRemoteDone && !snapshot?.user)
```

| isSnapshotReady | isRemoteDone | 有 snapshot | isHydrating | 说明 |
|:-:|:-:|:-:|:-:|------|
| ❌ | ❌ | - | ✅ | 刚启动，啥都没读完 |
| ❌ | ✅ | - | ✅ | 远端先回来（理论上不会发生） |
| ✅ | ❌ | ✅ | ❌ | 有快照兜底，不等远端 |
| ✅ | ❌ | ❌ | ✅ | 无快照，必须等远端 |
| ✅ | ✅ | - | ❌ | 两边都完成 |
