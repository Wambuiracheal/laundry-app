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
import { SocialSignInButtons } from "@/components/shared/SocialSignInButtons";
import { signInWithEmail } from "@/utils/authApi";
import { hasLoginErrors, type LoginErrors, type LoginValues, validateLogin } from "@/utils/loginValidation";
import { currentNextParam, postLoginPath, withCurrentNext } from "@/utils/session";

const initialValues: LoginValues = {
    email: "",
    password: "",
};

export function LoginScreen() {
    const [values, setValues] = useState<LoginValues>(initialValues);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [status, setStatus] = useState<{ text: string; tone: "error" | "success" } | null>(null);
    const showError = (text: string) => setStatus({ text, tone: "error" });
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
            const result = await signInWithEmail(values.email, values.password);
            const next = currentNextParam();
            if (result.status === "needs_profile") {
                router.replace(`/complete-profile${next ? `?next=${encodeURIComponent(next)}` : ""}`);
                return;
            }
            setStatus({ text: "Login successful. Redirecting...", tone: "success" });
            router.replace(postLoginPath(next, result.profile.role));
        } catch (error) {
            showError(error instanceof Error ? error.message : "Login failed.");
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

                <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:text-blue-800">
                        Forgot password?
                    </Link>
                </div>

                <button className={submitButtonClass} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Log in"}
                </button>

                {status ? <FormStatusMessage message={status.text} tone={status.tone} /> : null}

                <div className="flex items-center gap-3 py-1 text-slate-400">
                    <hr className="flex-1 border-slate-200" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">or continue with</span>
                    <hr className="flex-1 border-slate-200" />
                </div>

                <SocialSignInButtons disabled={isSubmitting} onError={showError} />

                <p className="pt-2 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        onClick={(event) => {
                            event.preventDefault();
                            router.push(withCurrentNext("/register"));
                        }}
                        className="font-semibold text-blue-700 hover:text-blue-800"
                    >
                        Sign up
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
