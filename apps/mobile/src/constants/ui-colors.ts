/**
 * UI Colors - Semantic colors, status colors, role colors
 */

// ─── Semantic / Functional Colors ──────────────────────────────────────────────────
export const UI_COLORS = {
  error: '#B91C1C',
  errorDark: '#F87171',
  success: '#10B981',
  successDark: '#34D399',
  link: '#0A7EA4',
  linkDark: '#38BDF8',

  // Role Colors
  contractorRole: '#1565C0',
  contractorRoleDark: '#42A5F5',
  builderRole: '#E65100',
  builderRoleDark: '#FF9E40',

  // Placeholder / Neutral
  placeholderBgLight: '#E0E0E0',
  placeholderBgDark: '#424242',
  placeholderIconLight: '#757575',
  placeholderIconDark: '#9E9E9E',

  // Input backgrounds
  contrastInputBackgroundLight: '#FFFFFF',
  contrastInputBorderLight: '#666666',
} as const;

// ─── Project Status Colors ──────────────────────────────────────────────────────────
export const PROJECT_STATUS_DOT_COLORS: Record<string, string> = {
  active: '#22c55e',
  on_hold: '#f97316',
  approval_needed: '#3b82f6',
  DEFAULT: '#6b7280',
};

export const PROJECT_STATUS_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#E8F5E9', text: '#2E7D32' },
  on_hold: { bg: '#FFEBEE', text: '#C62828' },
  approval_needed: { bg: '#FFF3E0', text: '#BF360C' },
  DEFAULT: { bg: '#E0E0E0', text: '#616161' },
};

// Status ID to name mapping
const STATUS_ID_TO_NAME: Record<number, string> = {
  1: 'active',
  2: 'on_hold',
  3: 'approval_needed',
};

export function getProjectStatusDotColor(statusId: number): string {
  const statusName = STATUS_ID_TO_NAME[statusId];
  return PROJECT_STATUS_DOT_COLORS[statusName ?? 'DEFAULT'] ?? PROJECT_STATUS_DOT_COLORS.DEFAULT;
}

export function getProjectStatusBadgeColor(statusId: number): { bg: string; text: string } {
  const statusName = STATUS_ID_TO_NAME[statusId];
  return PROJECT_STATUS_BADGE_COLORS[statusName ?? 'DEFAULT'] ?? PROJECT_STATUS_BADGE_COLORS.DEFAULT;
}

// ─── Task Status Colors ──────────────────────────────────────────────────────────────
export const TASK_STATUS_COLORS = {
  BLOCKED: {
    lightColor: '#6b7280',
    darkColor: '#9ca3af',
    lightBg: '#f3f4f6',
    darkBg: '#374151',
  },
  READY: {
    lightColor: '#3b82f6',
    darkColor: '#60a5fa',
    lightBg: '#eff6ff',
    darkBg: '#1e3a8a',
  },
  BOOKED: {
    lightColor: '#8b5cf6',
    darkColor: '#a78bfa',
    lightBg: '#f5f3ff',
    darkBg: '#5b21b6',
  },
  IN_PROGRESS: {
    lightColor: '#f97316',
    darkColor: '#fb923c',
    lightBg: '#fff7ed',
    darkBg: '#9a3412',
  },
  DONE: {
    lightColor: '#22c55e',
    darkColor: '#4ade80',
    lightBg: '#f0fdf4',
    darkBg: '#166534',
  },
} as const;

// ─── Subtask Status Colors ──────────────────────────────────────────────────────────
export const SUBTASK_STATUS_COLORS = {
  doneLight: '#E8F5E9',
  doneDark: '#1B5E20',
  inProgressLight: '#E3F2FD',
  inProgressDark: '#0D47A1',
  bookedLight: '#FFF3E0',
  bookedDark: '#BF360C',
  readyLight: '#E0F2F1',
  readyDark: '#004D40',
  blockedLight: '#FFEBEE',
  blockedDark: '#B71C1C',
  defaultLight: '#F3F4F6',
  defaultDark: '#334155',
} as const;

export const SUBTASK_COLORS = {
  borderLight: '#E5E7EB',
  borderDark: '#475569',
  accentLight: '#2563EB',
  accentDark: '#60A5FA',
} as const;

// ─── Skeleton / Loading Colors ───────────────────────────────────────────────────────
export const SKELETON_COLORS = {
  baseDark: '#2f2f2f',
  baseLight: '#e6e6e6',
  shimmerDark: '#3a3a3a',
  shimmerLight: '#f2f2f2',
} as const;

// ─── Document Icon Colors ────────────────────────────────────────────────────────────
export const DOCUMENT_ICON_COLORS = {
  pdf: { light: '#DC2626', dark: '#F87171' },
  excel: { light: '#16A34A', dark: '#4ADE80' },
  word: { light: '#2563EB', dark: '#60A5FA' },
  default: { light: '#71717A', dark: '#A1A1AA' },
} as const;

// ─── Surface Tints ───────────────────────────────────────────────────────────────────
export const SURFACE_TINT = {
  light: '#F0F4FA',
  dark: '#1A2332',
} as const;