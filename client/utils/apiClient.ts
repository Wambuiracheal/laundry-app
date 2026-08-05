export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

// Registered by AuthProvider so an expired/invalid session token can trigger a
// logout + redirect regardless of which authenticated call noticed the 401.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as TResponse;
}

export async function postJson<TResponse>(path: string, payload: unknown): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<TResponse>(response);
}

export async function getJson<TResponse>(path: string, accessToken?: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  // Only an authenticated request's 401 means "your session is no longer valid" —
  // an unauthenticated call (e.g. login with a wrong password) also returns 401
  // but must not trigger a global logout.
  if (accessToken && response.status === 401) {
    unauthorizedHandler?.();
  }

  return parseResponse<TResponse>(response);
}
