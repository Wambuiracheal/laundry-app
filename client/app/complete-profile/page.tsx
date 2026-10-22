"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { FormField, FormStatusMessage, formControlClass, submitButtonClass } from "@/components/shared/form/FormField";
import { useRouteAfterSignIn } from "@/components/shared/useFinishSignIn";
import { completeProfile, finishSignIn } from "@/utils/authApi";
import type { SignupRole } from "@/utils/roles";

type Values = { fullName: string; phone: string };
type Errors = Partial<Record<keyof Values, string>>;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (values.fullName.trim().split(/\s+/).length < 2) errors.fullName = "Enter your first and last name.";
  if (!/^\+?[0-9\s-]{10,15}$/.test(values.phone.trim())) errors.phone = "Enter your mobile number, e.g. 0712 345 678.";
  return errors;
}

/** Last sign-up step for accounts without a profile yet (usually social logins, which don't share a phone number). */
export default function CompleteProfilePage() {
  const router = useRouter();
  const routeAfterSignIn = useRouteAfterSignIn();
  const [values, setValues] = useState<Values>({ fullName: "", phone: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [role, setRole] = useState<SignupRole>("customer");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role") === "rider" ? "rider" : undefined;

    finishSignIn(roleParam).then(
      (result) => {
        // Already set up (or just completed from sign-up details): nothing to ask.
        if (result.status === "ready") {
          routeAfterSignIn(result, params.get("next"));
          return;
        }
        setRole(roleParam ?? result.suggested.role);
        setValues({ fullName: result.suggested.fullName, phone: result.suggested.phone });
        setLoading(false);
      },
      () => router.replace("/login"),
    );
  }, [routeAfterSignIn, router]);

  function setField(field: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      setIsSubmitting(true);
      setStatus(null);
      const profile = await completeProfile({ fullName: values.fullName.trim(), phone: values.phone.trim(), role });
      routeAfterSignIn({ status: "ready", profile }, new URLSearchParams(window.location.search).get("next"));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Couldn't save your details. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Finish setting up"
      subtitle={role === "rider" ? "A few details so we can send you delivery jobs." : "A few details so our riders can reach you and we can text you updates."}
    >
      {loading ? (
        <p className="text-sm text-slate-500">Loading your account…</p>
      ) : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          <FormField htmlFor="fullName" label="Full name" error={errors.fullName}>
            <input
              id="fullName"
              autoComplete="name"
              className={formControlClass}
              value={values.fullName}
              onChange={(event) => setField("fullName", event.target.value)}
            />
          </FormField>
          <FormField htmlFor="phone" label="Mobile number" info="For pickup calls, SMS updates and M-Pesa payments." error={errors.phone}>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="0712 345 678"
              className={formControlClass}
              value={values.phone}
              onChange={(event) => setField("phone", event.target.value)}
            />
          </FormField>
          <button className={submitButtonClass} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Continue"}
          </button>
          {status ? <FormStatusMessage message={status} tone="error" /> : null}
        </form>
      )}
    </AuthLayout>
  );
}
