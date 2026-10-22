"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { FormField, FormStatusMessage, formControlClass, submitButtonClass } from "@/components/shared/form/FormField";
import { useRouteAfterSignIn } from "@/components/shared/useFinishSignIn";
import { exchangeCodeFromUrl, finishSignIn, updatePassword } from "@/utils/authApi";
import { validateNewPassword, type NewPasswordErrors, type NewPasswordValues } from "@/utils/registerValidation";
import { getSupabase } from "@/utils/supabaseClient";

/** Opened from the reset email: the link signs the user in for this one purpose, then they pick a new password. */
export default function ResetPasswordPage() {
  const routeAfterSignIn = useRouteAfterSignIn();
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [values, setValues] = useState<NewPasswordValues>({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<NewPasswordErrors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    exchangeCodeFromUrl(new URLSearchParams(window.location.search))
      .then(async (error) => {
        // Without a session from the link there's no account to change the password for.
        const { data } = await getSupabase().auth.getSession();
        if (error || !data.session) {
          setLinkError(error);
          setState("invalid");
          return;
        }
        // Keep the one-time code out of the address bar and browser history.
        window.history.replaceState(null, "", "/reset-password");
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, []);

  function setField(field: keyof NewPasswordValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateNewPassword(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      setIsSubmitting(true);
      setStatus(null);
      await updatePassword(values.password);
      routeAfterSignIn(await finishSignIn(), null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't update your password.");
      setIsSubmitting(false);
    }
  }

  if (state === "invalid") {
    return (
      <AuthLayout title="Link expired" subtitle="Reset links work once and expire after an hour.">
        <div className="space-y-4">
          <FormStatusMessage message={linkError ?? "This link is invalid or has expired."} tone="error" />
          <Link href="/forgot-password" className={submitButtonClass}>
            Send a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="You'll be signed in once it's saved.">
      {state === "checking" ? (
        <p className="text-sm text-slate-500">Checking your link…</p>
      ) : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          <FormField
            htmlFor="password"
            label="New password"
            info="At least 8 characters with upper and lower case letters, a number and a symbol."
            error={errors.password}
          >
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={formControlClass}
              value={values.password}
              onChange={(event) => setField("password", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="confirmPassword" label="Confirm new password" error={errors.confirmPassword}>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={formControlClass}
              value={values.confirmPassword}
              onChange={(event) => setField("confirmPassword", event.target.value)}
            />
          </FormField>
          <button className={submitButtonClass} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save new password"}
          </button>
          {status ? <FormStatusMessage message={status} tone="error" /> : null}
        </form>
      )}
    </AuthLayout>
  );
}
