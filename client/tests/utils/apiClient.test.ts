import { describe, expect, it, vi } from "vitest";
import { ApiError, authRequest, browserNavigation, postJson } from "@/utils/apiClient";
import { clearSession, logout, parseSession, readSessionSnapshot, saveSession } from "@/utils/session";
import { fakeAuth } from "../supabaseMock";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("session storage", () => {
  it("stores the profile and sets the role cookie", () => {
    const listener = vi.fn();
    window.addEventListener("pl-session-change", listener);
    saveSession({ email: "jane@example.com", role: "customer" });

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

  it("logs out of Supabase and clears the profile, even when Supabase is unreachable", async () => {
    saveSession({ email: "jane@example.com", role: "customer" });
    await logout();
    expect(fakeAuth.signOut).toHaveBeenCalled();
    expect(readSessionSnapshot()).toBeNull();

    saveSession({ email: "jane@example.com", role: "customer" });
    fakeAuth.signOut.mockRejectedValueOnce(new Error("offline"));
    await logout();
    expect(readSessionSnapshot()).toBeNull();
  });
});

describe("postJson", () => {
  it("surfaces the API's error message and code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(400, { error: "Email already registered", code: "taken" })));
    const error = await postJson("/api/x", {}).catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ message: "Email already registered", status: 400, code: "taken" });
  });

  it("falls back to the status code when the body has no error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 500 })));
    await expect(postJson("/api/x", {})).rejects.toThrow("Request failed with status 500");
  });
});

describe("authRequest", () => {
  it("sends the Supabase access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authRequest("/api/orders")).resolves.toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ Authorization: "Bearer test-access-token" });
  });

  it("refreshes the Supabase session once on 401 and retries", async () => {
    fakeAuth.refreshSession.mockResolvedValueOnce({ data: { session: { access_token: "fresh" } }, error: null });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { id: "o1" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(authRequest("/api/orders/o1", { method: "PATCH", body: { notes: "hi" } })).resolves.toEqual({ id: "o1" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer fresh");
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ notes: "hi" }));
  });

  it("signs out and sends the visitor to login when there is no session", async () => {
    const assign = vi.spyOn(browserNavigation, "assign").mockImplementation(() => {});
    saveSession({ email: "jane@example.com", role: "customer" });
    fakeAuth.session = null;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(authRequest("/api/orders")).rejects.toThrow("Your session has expired. Please log in again.");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(readSessionSnapshot()).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login?next=%2F");
  });

  it("gives up when the refreshed token is rejected too", async () => {
    vi.spyOn(browserNavigation, "assign").mockImplementation(() => {});
    fakeAuth.refreshSession.mockResolvedValueOnce({ data: { session: { access_token: "fresh" } }, error: null });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(401, {})));
    await expect(authRequest("/api/orders", { redirect: false })).rejects.toMatchObject({ status: 401 });
  });

  it("sends accounts without a profile to finish signing up", async () => {
    const assign = vi.spyOn(browserNavigation, "assign").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(403, { error: "Finish setting up", code: "profile_required" })));

    await expect(authRequest("/api/orders")).rejects.toMatchObject({ code: "profile_required" });
    expect(assign).toHaveBeenCalledWith("/complete-profile?next=%2F");

    assign.mockClear();
    await expect(authRequest("/api/orders", { redirect: false })).rejects.toMatchObject({ code: "profile_required" });
    expect(assign).not.toHaveBeenCalled();
  });
});
