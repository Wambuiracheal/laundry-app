"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ActionFormLayout } from "@/components/shared/ActionFormLayout";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/mobile/icons";
import { FormField, iconInputWrapperClass } from "@/components/shared/form/FormField";
import { useToast } from "@/components/shared/toast/ToastProvider";
import {
  hasErrors,
  type FormErrors,
  type ResetPasswordValues,
  validateResetPassword,
} from "@/utils/actionFormValidation";
import { resetPassword } from "@/utils/authApi";

const initialValues: ResetPasswordValues = {
  password: "",
  confirmPassword: "",
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const toast = useToast();

  const [values, setValues] = useState<ResetPasswordValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<ResetPasswordValues>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function setField(field: keyof ResetPasswordValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const nextErrors = validateResetPassword(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      toast.error("Please fix the highlighted form errors.");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(token, values.password, values.confirmPassword);
      toast.success("Password updated. Please log in.");
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-slate-600">
        This reset link is invalid or missing a token. Request a new one from{" "}
        <Link href="/forgot-password" className="font-semibold text-blue-700">
          Forgot Password
        </Link>
        .
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <FormField htmlFor="password" label="New Password" error={errors.password}>
        <div className={iconInputWrapperClass}>
          <LockIcon className="h-5 w-5 text-slate-500" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent text-sm outline-none"
            value={values.password}
            onChange={(event) => setField("password", event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-slate-500 transition hover:text-slate-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </FormField>

      <FormField htmlFor="confirmPassword" label="Confirm New Password" error={errors.confirmPassword}>
        <div className={iconInputWrapperClass}>
          <LockIcon className="h-5 w-5 text-slate-500" />
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent text-sm outline-none"
            value={values.confirmPassword}
            onChange={(event) => setField("confirmPassword", event.target.value)}
          />
        </div>
      </FormField>

      <button
        className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <ActionFormLayout
      eyebrow="Auth"
      title="Reset Password"
      description="Choose a new password for your account."
      backHref="/login"
      backLabel="Back to Login"
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </ActionFormLayout>
  );
}
