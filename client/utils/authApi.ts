import type { AuthError } from "@supabase/supabase-js";
import { ApiError, authRequest } from "@/utils/apiClient";
import type { RegisterValues } from "@/utils/registerValidation";
import type { SignupRole } from "@/utils/roles";
import { saveSession } from "@/utils/session";
import { getSupabase } from "@/utils/supabaseClient";

/** The app's own account record: who you are here and what you can do. */
export type Profile = { id: string; fullName: string; email: string; phone: string; role: string };

/** Details from sign-up or the social provider, used to prefill the profile form. */
export type SuggestedProfile = { fullName: string; phone: string; phoneValid: boolean; role: SignupRole };

export type SignInResult = { status: "ready"; profile: Profile } | { status: "needs_profile"; suggested: SuggestedProfile };

export type SocialProvider = "google" | "facebook" | "apple";

export const SOCIAL_PROVIDERS: { id: SocialProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
  { id: "apple", label: "Apple" },
];

/** Turns Supabase's messages into ones customers can act on. */
export function friendlyAuthError(error: Pick<AuthError, "message"> & { status?: number; code?: string }) {
  const message = error.message || "";
  if (error.code === "invalid_credentials" || /invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (error.code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Confirm your email first: open the link we sent to your inbox.";
  }
  if (error.code === "user_already_exists" || /already registered/i.test(message)) {
    return "An account with this email already exists. Log in instead.";
  }
  if (error.status === 429 || /rate limit|too many/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  if (/provider is not enabled|unsupported provider/i.test(message)) return "That sign-in option isn't switched on yet. Use email instead.";
  if (/weak|password should/i.test(message)) return "Choose a stronger password: at least 8 characters with letters, a number and a symbol.";
  return message || "Something went wrong. Please try again.";
}

function rememberProfile(profile: Profile) {
  saveSession({ email: profile.email, fullName: profile.fullName, role: profile.role });
}

/** Where email links and social logins return to; `next` and the signup role ride along. */
function callbackUrl(params: { next?: string | null; role?: SignupRole }) {
  const query = new URLSearchParams();
  if (params.next) query.set("next", params.next);
  if (params.role && params.role !== "customer") query.set("role", params.role);
  const search = query.toString();
  return `${window.location.origin}/auth/callback${search ? `?${search}` : ""}`;
}

export function completeProfile(values: { fullName: string; phone: string; role: SignupRole }) {
  return authRequest<Profile>("/api/auth/profile", { method: "POST", body: values, redirect: false }).then((profile) => {
    rememberProfile(profile);
    return profile;
  });
}

/**
 * Loads the app profile for the Supabase session. A brand-new account has none yet: it's created
 * straight away when sign-up already gave us a full name and phone, otherwise the caller shows
 * the profile form.
 */
export async function finishSignIn(roleHint?: SignupRole): Promise<SignInResult> {
  try {
    const profile = await authRequest<Profile>("/api/auth/me", { redirect: false });
    rememberProfile(profile);
    return { status: "ready", profile };
  } catch (error) {
    if (!(error instanceof ApiError && error.code === "profile_required")) throw error;

    const suggested = (error.data as { suggested?: SuggestedProfile } | undefined)?.suggested ?? {
      fullName: "",
      phone: "",
      phoneValid: false,
      role: "customer" as const,
    };
    const role = roleHint ?? suggested.role;
    if (suggested.fullName.trim().split(/\s+/).length >= 2 && suggested.phoneValid) {
      try {
        return { status: "ready", profile: await completeProfile({ fullName: suggested.fullName, phone: suggested.phone, role }) };
      } catch {
        // Fall through to the form, which shows the reason.
      }
    }
    return { status: "needs_profile", suggested: { ...suggested, role } };
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(friendlyAuthError(error));
  return finishSignIn();
}

/**
 * Creates the Supabase login with the profile details attached. When the project asks for email
 * confirmation (the default) there's no session yet and the result is "confirm_email".
 */
export async function signUpWithEmail(values: RegisterValues, role: SignupRole, next: string | null): Promise<SignInResult | { status: "confirm_email" }> {
  const { data, error } = await getSupabase().auth.signUp({
    email: values.email.trim(),
    password: values.password,
    options: {
      emailRedirectTo: callbackUrl({ next, role }),
      data: { full_name: values.fullName.trim(), phone: values.phone.trim(), role },
    },
  });
  if (error) throw new Error(friendlyAuthError(error));
  // With confirmation on, Supabase hides whether the email is taken by returning a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    throw new Error("An account with this email already exists. Log in instead.");
  }
  if (!data.session) return { status: "confirm_email" };
  return finishSignIn(role);
}

/** Leaves for the provider's sign-in page; it comes back to /auth/callback. */
export async function signInWithProvider(provider: SocialProvider, params: { next?: string | null; role?: SignupRole } = {}) {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl(params),
      // The profile needs an email address; Apple and Facebook only share it when asked.
      scopes: provider === "apple" ? "name email" : provider === "facebook" ? "email" : undefined,
    },
  });
  if (error) throw new Error(friendlyAuthError(error));
}

/** Emails a reset link that opens /reset-password. Succeeds whether or not the account exists. */
export async function sendPasswordReset(email: string) {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(friendlyAuthError(error));
}

export async function updatePassword(password: string) {
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) throw new Error(friendlyAuthError(error));
}

const EMAIL_LINK_TYPES = ["email", "signup", "recovery", "invite", "magiclink", "email_change"] as const;
type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

/**
 * Finishes an email link or social login and starts the session. Handles both link formats:
 * `?code=` (social logins and Supabase's default emails; only works in the browser that asked)
 * and `?token_hash=&type=` (the email templates in DEPLOY.md; works on any device). Returns an
 * error message when the link was bad or expired, or null on success (or when there was nothing to do).
 */
export async function exchangeCodeFromUrl(search: URLSearchParams): Promise<string | null> {
  const invalid = "This link is invalid or has expired.";
  const linkError = search.get("error_description") ?? search.get("error");
  if (linkError) return /expired|invalid/i.test(linkError) ? invalid : linkError;

  const tokenHash = search.get("token_hash");
  const type = search.get("type") as EmailLinkType | null;
  if (tokenHash && type && EMAIL_LINK_TYPES.includes(type)) {
    const { error } = await getSupabase().auth.verifyOtp({ token_hash: tokenHash, type });
    return error ? invalid : null;
  }

  const code = search.get("code");
  if (!code) return null;
  const { error } = await getSupabase().auth.exchangeCodeForSession(code);
  if (!error) return null;
  // PKCE links must be opened in the same browser that requested them.
  return /code verifier/i.test(error.message) ? "Open this link in the same browser you used to sign up or request it." : invalid;
}
