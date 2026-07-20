"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ActionFormLayout } from "@/components/shared/ActionFormLayout";
import {
  FormField,
  formControlClass,
} from "@/components/shared/form/FormField";
import {
  hasErrors,
  type ForgotPasswordValues,
  type FormErrors,
  validateForgotPassword,
} from "@/utils/actionFormValidation";
import { postJson } from "@/utils/apiClient";

const initialValues: ForgotPasswordValues = {
  email: "",
};

export default function ForgotPasswordPage() {
  const [values, setValues] = useState<ForgotPasswordValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<ForgotPasswordValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForgotPassword(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      toast.error("Please fix the highlighted form errors.");
      return;
    }

    try {
      setIsSubmitting(true);
      await postJson("/actions/forgot-password", values);
      toast.success("Reset instructions sent to your email.");
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request password reset.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionFormLayout
      eyebrow="Auth"
      title="Forgot Password"
      description="Enter your email to receive password reset instructions."
      backHref="/login"
      backLabel="Back to Login"
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        <FormField
          htmlFor="email"
          label="Email Address"
          info="We will send a reset link if this account exists."
          error={errors.email}
        >
          <input
            id="email"
            className={formControlClass}
            value={values.email}
            onChange={(event) => setValues({ email: event.target.value })}
          />
        </FormField>

        <button
          className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </ActionFormLayout>
  );
}
