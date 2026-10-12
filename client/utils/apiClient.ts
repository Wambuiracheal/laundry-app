import { parseSession, readSessionSnapshot, saveSession } from "@/utils/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

async function readResponse<TResponse>(response: Response): Promise<TResponse> {
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

  return readResponse<TResponse>(response);
}

/** Exchanges the stored refresh token for a new pair. Returns the new access token, or null. */
async function refreshAccessToken(): Promise<string | null> {
  const session = parseSession(readSessionSnapshot());
  if (!session?.refreshToken) return null;

  try {
    const tokens = await postJson<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
      refreshToken: session.refreshToken,
    });
    saveSession({ ...session, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return tokens.accessToken;
  } catch {
    return null;
  }
}

/**
 * Sends a request with the signed-in user's access token. On a 401 it refreshes the token
 * once and retries, since access tokens are short-lived (and reset when the API restarts).
 * A FormData body is sent as multipart (for file uploads); anything else is sent as JSON.
 */
export async function authRequest<TResponse>(
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {},
): Promise<TResponse> {
  const isForm = body instanceof FormData;
  const send = (accessToken?: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        // The browser sets the multipart Content-Type (with its boundary) for FormData itself.
        ...(body === undefined || isForm ? {} : { "Content-Type": "application/json" }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

  let response = await send(parseSession(readSessionSnapshot())?.accessToken);

  if (response.status === 401) {
    const accessToken = await refreshAccessToken();
    if (!accessToken) {
      throw new Error("Your session has expired. Please log in again.");
    }
    response = await send(accessToken);
  }

  return readResponse<TResponse>(response);
}
