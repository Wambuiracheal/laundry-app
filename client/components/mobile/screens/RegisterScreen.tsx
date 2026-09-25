"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "@/components/mobile/icons";
import { AuthLayout } from "@/components/shared/AuthLayout";
import {
    FormField,
    FormStatusMessage,
    formControlClass,
    formSelectClass,
    iconInputWrapperClass,
    submitButtonClass,
} from "@/components/shared/form/FormField";
import { getGoogleSignupUrl, signup } from "@/utils/authApi";
import {
    hasRegisterErrors,
    type RegisterErrors,
    type RegisterValues,
    validateRegister,
} from "@/utils/registerValidation";
import { saveSession } from "@/utils/session";

const initialValues: RegisterValues = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "admin",
};

function handleGoogleSignup() {
    window.location.assign(getGoogleSignupUrl());
}

export function RegisterScreen() {
    const [values, setValues] = useState<RegisterValues>(initialValues);
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [status, setStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    function setField(field: keyof RegisterValues, value: string) {
        setValues((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextErrors = validateRegister(values);
        setErrors(nextErrors);

        if (hasRegisterErrors(nextErrors)) {
            setStatus(null);
            return;
        }

        try {
            setIsSubmitting(true);
            setStatus(null);

            const result = await signup(values);

            saveSession({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                email: result.user?.email ?? values.email.trim(),
                fullName: result.user?.fullName ?? values.fullName.trim(),
            });
            setStatus("Account created. Redirecting...");
            router.replace("/customer-dashboard");
            setValues(initialValues);
            setErrors({});
        } catch (error) {
            const message = error instanceof Error ? error.message : "Signup failed.";
            setStatus(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout title="Create your account" subtitle="Set up your Panda Laundry profile in under a minute.">
            <form className="space-y-4" onSubmit={submit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="fullName" label="Full name" error={errors.fullName}>
                        <input
                            id="fullName"
                            autoComplete="name"
                            className={formControlClass}
                            placeholder="Jane Wanjiru"
                            value={values.fullName}
                            onChange={(event) => setField("fullName", event.target.value)}
                        />
                    </FormField>

                    <FormField htmlFor="phone" label="Phone" error={errors.phone}>
                        <input
                            id="phone"
                            type="tel"
                            autoComplete="tel"
                            className={formControlClass}
                            placeholder="+254 7XX XXX XXX"
                            value={values.phone}
                            onChange={(event) => setField("phone", event.target.value)}
                        />
                    </FormField>
                </div>

                <FormField htmlFor="email" label="Email" error={errors.email}>
                    <div className={iconInputWrapperClass}>
                        <MailIcon className="h-4 w-4" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            className="w-full bg-transparent text-sm outline-none"
                            placeholder="name@example.com"
                            value={values.email}
                            onChange={(event) => setField("email", event.target.value)}
                        />
                    </div>
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField htmlFor="password" label="Password" error={errors.password}>
                        <div className={iconInputWrapperClass}>
                            <LockIcon className="h-4 w-4" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className="w-full bg-transparent text-sm outline-none"
                                placeholder="Password"
                                value={values.password}
                                onChange={(event) => setField("password", event.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="text-slate-400 transition hover:text-slate-700"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                        </div>
                    </FormField>

                    <FormField htmlFor="confirmPassword" label="Confirm password" error={errors.confirmPassword}>
                        <div className={iconInputWrapperClass}>
                            <LockIcon className="h-4 w-4" />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className="w-full bg-transparent text-sm outline-none"
                                placeholder="Repeat password"
                                value={values.confirmPassword}
                                onChange={(event) => setField("confirmPassword", event.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="text-slate-400 transition hover:text-slate-700"
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                aria-pressed={showConfirmPassword}
                            >
                                {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                        </div>
                    </FormField>
                </div>
                {!errors.password && !errors.confirmPassword ? (
                    <p className="-mt-2 text-xs text-slate-400">Use at least 8 characters. Mixing letters and numbers makes it stronger.</p>
                ) : null}

                <FormField htmlFor="role" label="Role" info="Default role set to admin" error={errors.role}>
                    <select
                        id="role"
                        className={formSelectClass}
                        value={values.role}
                        onChange={(event) => setField("role", event.target.value)}
                    >
                        <option value="">Select a role...</option>
                        <option value="admin">admin</option>
                        <option value="customer">customer</option>
                        <option value="rider">rider</option>
                        <option value="staff">staff</option>
                    </select>
                </FormField>

                <button className={submitButtonClass} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : "Create account"}
                </button>

                <button
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isSubmitting}
                >
                    Continue with Google
                </button>

                {status ? <FormStatusMessage message={status} /> : null}

                <p className="pt-2 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800">
                        Log in
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
