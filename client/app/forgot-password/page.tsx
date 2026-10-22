"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { FormField, FormStatusMessage, formControlClass, submitButtonClass } from "@/components/shared/form/FormField";
import Link from "next/link";
import { hasErrors, type ForgotPasswordValues, type FormErrors, validateForgotPassword } from "@/utils/actionFormValidation";
import { sendPasswordReset } from "@/utils/authApi";

const initialValues: ForgotPasswordValues = {
  email: "",
};

export default function ForgotPasswordPage() {
  const [values, setValues] = useState<ForgotPasswordValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<ForgotPasswordValues>>({});
  const [status, setStatus] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForgotPassword(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      setStatus(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus(null);
      await sendPasswordReset(values.email);
      // Same message whether or not the account exists, so this can't be used to probe for emails.
      setStatus({ text: `If an account exists for ${values.email.trim()}, we've emailed a link to reset your password.`, tone: "success" });
      setValues(initialValues);
    } catch (error) {
      setStatus({ text: error instanceof Error ? error.message : "Couldn't send the reset email.", tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormField htmlFor="email" label="Email address" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={formControlClass}
            placeholder="name@example.com"
            value={values.email}
            onChange={(event) => setValues({ email: event.target.value })}
          />
        </FormField>

        <button className={submitButtonClass} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>

        {status ? <FormStatusMessage message={status.text} tone={status.tone} /> : null}

        <p className="text-center text-sm text-slate-500">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
            Back to login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
