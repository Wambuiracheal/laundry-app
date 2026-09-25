import { postJson } from "@/utils/apiClient";

/**
 * Presence-only cookie read by `proxy.ts` to decide whether to show the app or send the
 * visitor to /login. It holds no credentials; the tokens live in localStorage and the API
 * remains the source of truth for authorization.
 */
export const SESSION_COOKIE = "pl_session";

const STORAGE_KEY = "pl_session";
const CHANGE_EVENT = "pl-session-change";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type Session = {
  accessToken?: string;
  refreshToken?: string;
  email: string;
  fullName?: string;
};

export function saveSession(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private mode); the cookie still gates navigation.
  }
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Raw JSON string, so it can be used directly as a `useSyncExternalStore` snapshot. */
export function readSessionSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseSession(snapshot: string | null): Session | null {
  if (!snapshot) return null;
  try {
    return JSON.parse(snapshot) as Session;
  } catch {
    return null;
  }
}

export function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Revokes the refresh token server-side (best effort), then clears the local session. */
export async function logout() {
  const refreshToken = parseSession(readSessionSnapshot())?.refreshToken;
  if (refreshToken) {
    await postJson("/api/auth/logout", { refreshToken }).catch(() => undefined);
  }
  clearSession();
}

/** Only allow same-site relative paths as a post-login destination. */
export function safeNextPath(value: string | null, fallback = "/customer-dashboard") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
