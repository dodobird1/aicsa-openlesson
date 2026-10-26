import "server-only";

// Best-effort per-process protection, not a distributed or authenticated quota.
// Proxies must strip and overwrite x-forwarded-for; use an edge limiter in production.
const windows = new Map<string, { count: number; expires: number }>();
const WINDOW_MS = 60_000;
export function allowChatRequest(key: string, now = Date.now()): boolean {
  for (const [id, window] of windows) if (window.expires <= now) windows.delete(id);
  const existing = windows.get(key);
  if (existing) {
    if (existing.count >= 10) return false;
    existing.count += 1;
    return true;
  }
  if (windows.size >= 10_000) {
    const oldest = windows.keys().next().value;
    if (oldest) windows.delete(oldest);
  }
  windows.set(key, { count: 1, expires: now + WINDOW_MS });
  return true;
}
