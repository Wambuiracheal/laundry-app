import { vi } from "vitest";

type FakeSession = { access_token: string } | null;

/** Stand-in for `supabase.auth`; tests set `fakeAuth.session` and override methods as needed. */
export const fakeAuth = {
  session: { access_token: "test-access-token" } as FakeSession,
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  signOut: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  onAuthStateChange: vi.fn(),
};

/** Back to a signed-in user with default (successful) behaviour. */
export function resetFakeAuth() {
  fakeAuth.session = { access_token: "test-access-token" };
  fakeAuth.getSession.mockReset().mockImplementation(async () => ({ data: { session: fakeAuth.session }, error: null }));
  fakeAuth.refreshSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  fakeAuth.signOut.mockReset().mockImplementation(async () => {
    fakeAuth.session = null;
    return { error: null };
  });
  fakeAuth.signInWithPassword.mockReset().mockResolvedValue({ data: {}, error: null });
  fakeAuth.signUp.mockReset().mockResolvedValue({ data: { user: { identities: [{}] }, session: null }, error: null });
  fakeAuth.signInWithOAuth.mockReset().mockResolvedValue({ data: {}, error: null });
  fakeAuth.resetPasswordForEmail.mockReset().mockResolvedValue({ data: {}, error: null });
  fakeAuth.updateUser.mockReset().mockResolvedValue({ data: {}, error: null });
  fakeAuth.exchangeCodeForSession.mockReset().mockResolvedValue({ data: {}, error: null });
  fakeAuth.verifyOtp.mockReset().mockResolvedValue({ data: {}, error: null });
  fakeAuth.onAuthStateChange.mockReset().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
}

resetFakeAuth();
