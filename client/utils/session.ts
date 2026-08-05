export type SessionUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
};

const SESSION_KEY = "panda-laundry-session";

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
