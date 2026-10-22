import { describe, expect, it, vi } from "vitest";
import { authRequest, postJson } from "@/utils/apiClient";
import { clearSession, parseSession, readSessionSnapshot, saveSession } from "@/utils/session";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("session storage", () => {
  it("stores the session and sets the role cookie", () => {
    const listener = vi.fn();
    window.addEventListener("pl-session-change", listener);
    saveSession({ email: "jane@example.com", role: "customer", accessToken: "a" });

    expect(parseSession(readSessionSnapshot())).toMatchObject({ email: "jane@example.com", role: "customer" });
    expect(document.cookie).toContain("pl_session=customer");
    expect(listener).toHaveBeenCalledTimes(1);

    clearSession();
    expect(readSessionSnapshot()).toBeNull();
    expect(document.cookie).not.toContain("pl_session=");
    window.removeEventListener("pl-session-change", listener);
  });

  it("writes 'unknown' to the cookie for an unrecognised role", () => {
    saveSession({ email: "x@example.com", role: "superuser" });
    expect(document.cookie).toContain("pl_session=unknown");
  });

  it("returns null for corrupt stored JSON", () => {
    expect(parseSession("{not json")).toBeNull();
  });
});

describe("postJson", () => {
  it("surfaces the API's error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { error: "Email already registered" })));
    await expect(postJson("/api/auth/register", {})).rejects.toThrow("Email already registered");
  });

  it("falls back to the status code when the body has no error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 500 })));
    await expect(postJson("/api/x", {})).rejects.toThrow("Request failed with status 500");
  });
});

describe("authRequest", () => {
  it("sends the stored access token", async () => {
    saveSession({ email: "jane@example.com", role: "customer", accessToken: "token-1" });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authRequest("/api/orders")).resolves.toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ Authorization: "Bearer token-1" });
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    saveSession({ email: "jane@example.com", role: "customer", accessToken: "old", refreshToken: "r-old" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: "new", refreshToken: "r-new" }))
      .mockResolvedValueOnce(jsonResponse(200, { id: "o1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authRequest("/api/orders/o1", { method: "PATCH", body: { notes: "hi" } })).resolves.toEqual({ id: "o1" });

    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/auth\/refresh$/);
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe("Bearer new");
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ notes: "hi" }));
    expect(parseSession(readSessionSnapshot())).toMatchObject({ accessToken: "new", refreshToken: "r-new" });
  });

  it("reports an expired session when refresh is impossible", async () => {
    saveSession({ email: "jane@example.com", role: "customer", accessToken: "old" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, {})));
    await expect(authRequest("/api/orders")).rejects.toThrow("Your session has expired. Please log in again.");
  });
});
