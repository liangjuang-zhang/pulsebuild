/**
 * Network Error Detection
 */
const NETWORK_ERROR_PATTERNS = [
  'network',
  'connection',
  'timeout',
  'timed out',
  'fetch',
  'offline',
  'request failed',
  '503',
  '504',
];

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}