/**
 * 认证会话 Store（Zustand）
 *
 * 核心职责：
 * 1. 管理"有效会话"状态 —— Better Auth 认证状态 + WatermelonDB 用户数据
 * 2. 提供 useAuthSession()  —— 页面读取当前认证状态
 * 3. 提供 useAuthSessionSync() —— 在根布局中调用，负责持续同步认证状态
 *
 * 数据源策略：
 * - Better Auth: 仅用于认证状态（session 是否有效）
 * - WatermelonDB: 用户 profile 数据（离线优先）
 * - 即使离线完成 onboarding，本地数据立即生效
 */

/* ───────── Imports ───────── */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { authClient } from '@/lib/auth-client';
import { database } from '@/lib/database';
import { User } from '@/lib/database/models';
import { useNetworkStatus } from '@/hooks/use-network-status';

/* ───────── Types ───────── */

/** 用户快照数据（供 UI 使用） */
export interface AuthSnapshotUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phoneNumber: string | null;
  jobTitle: string | null;
  companyName: string | null;
  status: string;
  onboardingCompletedAt: Date | null;
}

/** 有效会话结构 */
export interface EffectiveSession {
  user: AuthSnapshotUser;
}

/** Store 状态 */
export interface AuthSessionState {
  hasLocalSession: boolean;
  isHydrating: boolean;
  isOfflineSession: boolean;
  session: EffectiveSession | null;
}

/** Store 接口（含 actions） */
interface AuthSessionStore extends AuthSessionState {
  setStateFromSource: (state: AuthSessionState) => void;
  refreshSession: () => Promise<void>;
}

/** 同步 reducer 状态 */
interface SyncState {
  localUser: AuthSnapshotUser | null;
  isLocalReady: boolean;
  isValidSession: boolean | null;
  isRemoteDone: boolean;
}

/** 同步 reducer action */
type SyncAction =
  | { type: 'local-loaded'; user: AuthSnapshotUser | null }
  | { type: 'session-checked'; isValid: boolean };

/* ───────── Helpers ───────── */

/** 比较两个用户快照是否相等 */
function isUserEqual(
  a: AuthSnapshotUser | null | undefined,
  b: AuthSnapshotUser | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.email === b.email &&
    a.image === b.image &&
    a.phoneNumber === b.phoneNumber &&
    a.onboardingCompletedAt?.getTime() === b.onboardingCompletedAt?.getTime() &&
    a.jobTitle === b.jobTitle &&
    a.companyName === b.companyName &&
    a.status === b.status
  );
}

/** 转换为 Date 或 null（过滤 epoch 值） */
function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) {
    // WatermelonDB 对 null 返回 1970-01-01，需要过滤
    const epoch = new Date(0);
    if (value.getTime() === epoch.getTime()) return null;
    if (!isNaN(value.getTime())) return value;
  }
  if (typeof value === 'string' && value.length > 0) return new Date(value);
  return null;
}

/** 从 WatermelonDB 读取本地用户数据 */
async function readLocalUser(): Promise<AuthSnapshotUser | null> {
  try {
    const users = await database.get<User>('user').query().fetch();
    if (users.length === 0) {
      console.log('[AuthSession] WatermelonDB: 无用户记录');
      return null;
    }
    const user = users[0];
    console.log('[AuthSession] WatermelonDB 读取用户:', {
      id: user.id,
      name: user.name,
      email: user.email,
      onboardingCompletedAt: user.onboardingCompletedAt,
    });
    return {
      id: user.id,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      phoneNumber: user.phoneNumber ?? null,
      jobTitle: user.jobTitle ?? null,
      companyName: user.companyName ?? null,
      status: user.status,
      onboardingCompletedAt: toDateOrNull(user.onboardingCompletedAt),
    };
  } catch (error) {
    console.error('[AuthSession] WatermelonDB 读取失败:', error);
    return null;
  }
}

/* ───────── Store ───────── */

const initialState: AuthSessionState = {
  hasLocalSession: false,
  isHydrating: true,
  isOfflineSession: false,
  session: null,
};

export const useAuthSessionStore = create<AuthSessionStore>((set, get) => ({
  ...initialState,

  setStateFromSource: (next) => {
    const prev = get();
    if (
      prev.hasLocalSession === next.hasLocalSession &&
      prev.isHydrating === next.isHydrating &&
      prev.isOfflineSession === next.isOfflineSession &&
      isUserEqual(prev.session?.user, next.session?.user)
    ) {
      return;
    }
    set(next);
  },

  refreshSession: async () => {
    console.log('[AuthSession] refreshSession: 开始');
    const res = await authClient.getSession();
    const isValidSession = Boolean(res.data?.user?.id);

    console.log('[AuthSession] Better Auth session:', {
      isValidSession,
      userId: res.data?.user?.id,
      onboardingCompletedAt: res.data?.user?.onboardingCompletedAt,
    });

    // 用户数据从 WatermelonDB 读取（不写入，避免 writer 队列堵塞）
    const localUser = await readLocalUser();

    // 如果远端有用户但本地无数据，临时用远端数据
    let effectiveUser = localUser;
    if (!localUser && res.data?.user) {
      const baUser = res.data.user;
      effectiveUser = {
        id: baUser.id,
        name: baUser.name ?? null,
        email: baUser.email ?? null,
        image: baUser.image ?? null,
        phoneNumber: baUser.phoneNumber ?? null,
        jobTitle: baUser.jobTitle ?? null,
        companyName: baUser.companyName ?? null,
        status: baUser.status ?? 'active',
        onboardingCompletedAt: baUser.onboardingCompletedAt ? new Date(baUser.onboardingCompletedAt) : null,
      };
    }

    console.log('[AuthSession] 最终 session:', {
      hasLocalSession: Boolean(localUser),
      onboardingCompletedAt: effectiveUser?.onboardingCompletedAt?.toISOString() ?? null,
    });

    get().setStateFromSource({
      hasLocalSession: Boolean(localUser),
      isHydrating: false,
      isOfflineSession: !isValidSession && Boolean(localUser),
      session: effectiveUser ? { user: effectiveUser } : null,
    });
  },
}));

/* ───────── Reducer ───────── */

const syncInitial: SyncState = {
  localUser: null,
  isLocalReady: false,
  isValidSession: null,
  isRemoteDone: false,
};

function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'local-loaded':
      return { ...state, localUser: action.user, isLocalReady: true };
    case 'session-checked':
      return { ...state, isValidSession: action.isValid, isRemoteDone: true };
  }
}

/* ───────── Hooks ───────── */

/**
 * 认证同步 Hook
 * 在根布局调用，负责初始化和持续同步认证状态
 */
export function useAuthSessionSync() {
  const { isConnected } = useNetworkStatus();
  const refreshSession = useAuthSessionStore((s) => s.refreshSession);
  const setStateFromSource = useAuthSessionStore((s) => s.setStateFromSource);
  const [state, dispatch] = useReducer(syncReducer, syncInitial);
  const mountedRef = useRef(true);

  // 清理：标记组件已卸载
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ① 从 WatermelonDB 读取本地用户数据（快速显示）
  useEffect(() => {
    readLocalUser().then((user) => {
      dispatch({ type: 'local-loaded', user });
    });
  }, []);

  // ② 验证 Better Auth session 并同步数据
  const checkAndSyncSession = useCallback(async () => {
    if (!isConnected) {
      dispatch({ type: 'session-checked', isValid: false });
      return;
    }
    try {
      await refreshSession();
      if (mountedRef.current) {
        dispatch({ type: 'session-checked', isValid: true });
      }
    } catch {
      if (mountedRef.current) {
        dispatch({ type: 'session-checked', isValid: false });
      }
    }
  }, [isConnected, refreshSession]);

  useEffect(() => { void checkAndSyncSession(); }, [checkAndSyncSession]);

  // ③ 写 Zustand store（本地数据作为初始显示）
  useEffect(() => {
    if (!state.isLocalReady) return;
    setStateFromSource({
      hasLocalSession: Boolean(state.localUser),
      isHydrating: !state.isLocalReady,
      isOfflineSession: !state.isValidSession && Boolean(state.localUser),
      session: state.localUser ? { user: state.localUser } : null,
    });
  }, [state, setStateFromSource]);
}

/**
 * 认证状态 Hook
 * 供页面组件读取当前认证状态
 */
export function useAuthSession() {
  return useAuthSessionStore(useShallow((s) => ({
    hasLocalSession: s.hasLocalSession,
    isHydrating: s.isHydrating,
    isOfflineSession: s.isOfflineSession,
    session: s.session,
  })));
}