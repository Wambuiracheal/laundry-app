"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "@/components/mobile/icons";
import { AuthLayout } from "@/components/shared/AuthLayout";
import {
    FormField,
    FormStatusMessage,
    iconInputWrapperClass,
    submitButtonClass,
} from "@/components/shared/form/FormField";
import { getGoogleLoginUrl, login } from "@/utils/authApi";
import { hasLoginErrors, type LoginErrors, type LoginValues, validateLogin } from "@/utils/loginValidation";
import { safeNextPath, saveSession } from "@/utils/session";

const initialValues: LoginValues = {
    email: "",
    password: "",
};

const socialButtonClass =
    "flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

function handleGoogleLogin() {
    window.location.assign(getGoogleLoginUrl());
}

export function LoginScreen() {
    const [values, setValues] = useState<LoginValues>(initialValues);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [status, setStatus] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    function setField(field: keyof LoginValues, value: string) {
        setValues((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }

    async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextErrors = validateLogin(values);
        setErrors(nextErrors);

        if (hasLoginErrors(nextErrors)) {
            setStatus(null);
            return;
        }

        try {
            setIsSubmitting(true);
            setStatus(null);
            const result = await login(values);
            saveSession({ accessToken: result.accessToken, refreshToken: result.refreshToken, email: values.email.trim() });
            setStatus("Login successful. Redirecting...");
            router.replace(safeNextPath(new URLSearchParams(window.location.search).get("next")));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Login failed.";
            setStatus(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout title="Welcome back" subtitle="Log in to manage your pickups and orders.">
            <form className="space-y-4" onSubmit={submit} noValidate>
                <FormField htmlFor="email" label="Email address" error={errors.email}>
                    <div className={iconInputWrapperClass}>
                        <MailIcon />
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

                <FormField htmlFor="password" label="Password" error={errors.password}>
                    <div className={iconInputWrapperClass}>
                        <LockIcon />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="w-full bg-transparent text-sm outline-none"
                            placeholder="••••••••"
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
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </FormField>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-700" />
                        <span>Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                        Forgot password?
                    </Link>
                </div>

                <button className={submitButtonClass} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Log in"}
                </button>

                {status ? <FormStatusMessage message={status} /> : null}

                <div className="flex items-center gap-3 py-1 text-slate-400">
                    <hr className="flex-1 border-slate-200" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">or continue with</span>
                    <hr className="flex-1 border-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button className={socialButtonClass} type="button" aria-label="Continue with Google" onClick={handleGoogleLogin}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <path
                                fill="#EA4335"
                                d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.5-.2-2.2H12z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 22c2.6 0 4.9-.9 6.5-2.5l-3.1-2.4c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1l-3.2 2.5C4.8 19.7 8.1 22 12 22z"
                            />
                            <path
                                fill="#4A90E2"
                                d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3.2-2.5C2.4 9.1 2 10.5 2 12s.4 2.9 1.2 4.1l3.2-2.2z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M12 6.1c1.4 0 2.7.5 3.6 1.4l2.7-2.7C16.8 3.3 14.6 2.4 12 2.4c-3.9 0-7.2 2.3-8.8 5.6l3.2 2.5c.8-2.5 3-4.4 5.6-4.4z"
                            />
                        </svg>
                        Google
                    </button>
                    <button className={socialButtonClass} type="button" aria-label="Continue with Apple">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="h-4 w-4" aria-hidden="true">
                            <path d="M319.1 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7-55.8 .9-115.1 44.5-115.1 133.2 0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.5 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                        </svg>
                        Apple
                    </button>
                </div>

                <p className="pt-2 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="font-semibold text-blue-700 hover:text-blue-800">
                        Sign up
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
