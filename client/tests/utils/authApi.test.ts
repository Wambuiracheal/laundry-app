import { describe, expect, it, vi } from "vitest";
import {
  exchangeCodeFromUrl,
  finishSignIn,
  friendlyAuthError,
  sendPasswordReset,
  signInWithEmail,
  signInWithProvider,
  signUpWithEmail,
} from "@/utils/authApi";
import { parseSession, readSessionSnapshot } from "@/utils/session";
import { fakeAuth } from "../supabaseMock";

const profile = { id: "u1", fullName: "Jane Wanjiru", email: "jane@example.com", phone: "+254712345678", role: "customer" };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

/** Routes fake API calls by path. */
function stubApi(routes: Record<string, () => Response>) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
    const path = new URL(url).pathname;
    const route = routes[path];
    if (!route) throw new Error(`Unexpected request to ${path}`);
    return route();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const registerValues = {
  fullName: "Jane Wanjiru",
  email: " jane@example.com ",
  phone: "0712 345 678",
  password: "Str0ng!Pass",
  confirmPassword: "Str0ng!Pass",
};

describe("finishSignIn", () => {
  it("loads the existing profile and caches it", async () => {
    stubApi({ "/api/auth/me": () => json(200, profile) });
    await expect(finishSignIn()).resolves.toEqual({ status: "ready", profile });
    expect(parseSession(readSessionSnapshot())).toEqual({ email: "jane@example.com", fullName: "Jane Wanjiru", role: "customer" });
  });

  it("creates the profile straight away from sign-up details", async () => {
    const fetchMock = stubApi({
      "/api/auth/me": () =>
        json(404, { code: "profile_required", suggested: { fullName: "Jane Wanjiru", phone: "0712345678", phoneValid: true, role: "rider" } }),
      "/api/auth/profile": () => json(201, { ...profile, role: "rider" }),
    });

    await expect(finishSignIn()).resolves.toMatchObject({ status: "ready", profile: { role: "rider" } });
    const [, init] = fetchMock.mock.calls[1];
    expect(JSON.parse(String(init?.body))).toEqual({ fullName: "Jane Wanjiru", phone: "0712345678", role: "rider" });
  });

  it("asks for details a social login didn't share", async () => {
    stubApi({
      "/api/auth/me": () => json(404, { code: "profile_required", suggested: { fullName: "Jane Wanjiru", phone: "", phoneValid: false, role: "customer" } }),
    });
    await expect(finishSignIn("rider")).resolves.toEqual({
      status: "needs_profile",
      suggested: { fullName: "Jane Wanjiru", phone: "", phoneValid: false, role: "rider" },
    });
  });

  it("falls back to the form when creating the profile fails", async () => {
    stubApi({
      "/api/auth/me": () => json(404, { code: "profile_required", suggested: { fullName: "Jane Wanjiru", phone: "0712345678", phoneValid: true, role: "customer" } }),
      "/api/auth/profile": () => json(409, { error: "An account with this email already exists" }),
    });
    await expect(finishSignIn()).resolves.toMatchObject({ status: "needs_profile" });
  });
});

describe("email sign-in and sign-up", () => {
  it("signs in with a trimmed email and loads the profile", async () => {
    stubApi({ "/api/auth/me": () => json(200, profile) });
    await expect(signInWithEmail(" jane@example.com ", "pw")).resolves.toMatchObject({ status: "ready" });
    expect(fakeAuth.signInWithPassword).toHaveBeenCalledWith({ email: "jane@example.com", password: "pw" });
  });

  it("explains wrong passwords and unconfirmed emails", async () => {
    fakeAuth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: "Invalid login credentials", code: "invalid_credentials" } });
    await expect(signInWithEmail("jane@example.com", "nope")).rejects.toThrow("Incorrect email or password.");
    fakeAuth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: "Email not confirmed" } });
    await expect(signInWithEmail("jane@example.com", "pw")).rejects.toThrow(/Confirm your email first/);
  });

  it("sends profile details with the sign-up and waits for email confirmation", async () => {
    await expect(signUpWithEmail(registerValues, "rider", "/rider")).resolves.toEqual({ status: "confirm_email" });
    expect(fakeAuth.signUp).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "Str0ng!Pass",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/callback?next=%2Frider&role=rider",
        data: { full_name: "Jane Wanjiru", phone: "0712 345 678", role: "rider" },
      },
    });
  });

  it("reports an email that's already registered", async () => {
    fakeAuth.signUp.mockResolvedValueOnce({ data: { user: { identities: [] }, session: null }, error: null });
    await expect(signUpWithEmail(registerValues, "customer", null)).rejects.toThrow(/already exists/);
  });

  it("finishes straight away when the project doesn't require confirmation", async () => {
    fakeAuth.signUp.mockResolvedValueOnce({ data: { user: { identities: [{}] }, session: { access_token: "t" } }, error: null });
    stubApi({ "/api/auth/me": () => json(200, profile) });
    await expect(signUpWithEmail(registerValues, "customer", null)).resolves.toMatchObject({ status: "ready" });
  });
});

describe("social logins and password resets", () => {
  it("asks Apple and Facebook for the email address and returns to the callback", async () => {
    await signInWithProvider("apple", { next: "/new-order" });
    expect(fakeAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "apple",
      options: { redirectTo: "http://localhost:3000/auth/callback?next=%2Fnew-order", scopes: "name email" },
    });
    await signInWithProvider("google");
    expect(fakeAuth.signInWithOAuth).toHaveBeenLastCalledWith({
      provider: "google",
      options: { redirectTo: "http://localhost:3000/auth/callback", scopes: undefined },
    });
  });

  it("says when a provider isn't switched on", async () => {
    fakeAuth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: { message: "Unsupported provider: provider is not enabled" } });
    await expect(signInWithProvider("facebook")).rejects.toThrow(/isn't switched on yet/);
  });

  it("sends reset links to the reset page", async () => {
    await sendPasswordReset(" jane@example.com ");
    expect(fakeAuth.resetPasswordForEmail).toHaveBeenCalledWith("jane@example.com", { redirectTo: "http://localhost:3000/reset-password" });
  });

  it("explains rate limits", () => {
    expect(friendlyAuthError({ message: "email rate limit exceeded", status: 429 })).toMatch(/Too many attempts/);
  });
});

describe("exchangeCodeFromUrl", () => {
  it("does nothing without a code", async () => {
    await expect(exchangeCodeFromUrl(new URLSearchParams())).resolves.toBeNull();
    expect(fakeAuth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("exchanges a PKCE code", async () => {
    await expect(exchangeCodeFromUrl(new URLSearchParams("code=abc"))).resolves.toBeNull();
    expect(fakeAuth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
  });

  it("verifies token-hash links from the custom email templates", async () => {
    await expect(exchangeCodeFromUrl(new URLSearchParams("token_hash=h1&type=recovery"))).resolves.toBeNull();
    expect(fakeAuth.verifyOtp).toHaveBeenCalledWith({ token_hash: "h1", type: "recovery" });
  });

  it("explains expired links and links opened in another browser", async () => {
    await expect(exchangeCodeFromUrl(new URLSearchParams("error=access_denied&error_description=Email+link+is+invalid+or+has+expired"))).resolves.toBe(
      "This link is invalid or has expired.",
    );
    fakeAuth.exchangeCodeForSession.mockResolvedValueOnce({ data: {}, error: { message: "invalid request: both auth code and code verifier should be non-empty" } });
    await expect(exchangeCodeFromUrl(new URLSearchParams("code=abc"))).resolves.toMatch(/same browser/);
  });
});
