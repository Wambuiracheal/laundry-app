import { clearSession } from "@/utils/session";
import { currentAccessToken, getSupabase } from "@/utils/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

/** An API error, with the HTTP status and the API's error `code` (e.g. "profile_required") when given. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please log in again.";

async function readResponse<TResponse>(response: Response): Promise<TResponse> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data && typeof data.code === "string" ? data.code : undefined, data);
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

/** Full-page navigation, kept on an object so tests can watch it. */
export const browserNavigation = {
  assign(url: string) {
    window.location.assign(url);
  },
};

/** Sends the visitor to `path`, remembering the current page so they come back after. */
function leaveTo(path: string) {
  if (typeof window === "undefined") return;
  const here = `${window.location.pathname}${window.location.search}`;
  browserNavigation.assign(`${path}?next=${encodeURIComponent(here)}`);
}

/**
 * Sends a request with the signed-in user's Supabase access token. On a 401 it refreshes the
 * token once and retries. Signed-out visitors are sent to login, and accounts that haven't
 * finished sign-up to the profile form. A FormData body is sent as multipart (for file
 * uploads); anything else is sent as JSON.
 */
export async function authRequest<TResponse>(
  path: string,
  { method = "GET", body, redirect = true }: { method?: string; body?: unknown; redirect?: boolean } = {},
): Promise<TResponse> {
  const isForm = body instanceof FormData;
  const send = (accessToken: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        // The browser sets the multipart Content-Type (with its boundary) for FormData itself.
        ...(body === undefined || isForm ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${accessToken}`,
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

  const signedOut = () => {
    clearSession();
    if (redirect) leaveTo("/login");
    return new ApiError(SESSION_EXPIRED_MESSAGE, 401);
  };

  const token = await currentAccessToken();
  if (!token) throw signedOut();

  let response = await send(token);
  if (response.status === 401) {
    const { data } = await getSupabase().auth.refreshSession();
    const refreshed = data.session?.access_token;
    if (!refreshed) throw signedOut();
    response = await send(refreshed);
    if (response.status === 401) throw signedOut();
  }

  try {
    return await readResponse<TResponse>(response);
  } catch (error) {
    if (redirect && error instanceof ApiError && error.code === "profile_required") leaveTo("/complete-profile");
    throw error;
  }
}
