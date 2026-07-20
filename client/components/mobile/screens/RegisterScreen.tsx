"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "@/components/mobile/icons";
import { MobileLayout, SoftCard } from "@/components/mobile/primitives";
import {
    FormField,
    formControlClass,
    formSelectClass,
    iconInputWrapperClass,
} from "@/components/shared/form/FormField";
import logo from "@/public/mobile/logo.png";
import { getGoogleSignupUrl, signup } from "@/utils/authApi";
import {
    hasRegisterErrors,
    type RegisterErrors,
    type RegisterValues,
    validateRegister,
} from "@/utils/registerValidation";

const initialValues: RegisterValues = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "admin",
};

export function RegisterScreen() {
    const [values, setValues] = useState<RegisterValues>(initialValues);
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            toast.error("Please fix the highlighted form errors.");
            return;
        }

        try {
            setIsSubmitting(true);

            const result = await signup(values);

            toast.success(result.message || "Account created successfully. You can now log in.");
            setValues(initialValues);
            setErrors({});
        } catch (error) {
            const message = error instanceof Error ? error.message : "Signup failed.";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <MobileLayout>
            <div className="pt-12">
                <SoftCard>
                    <div className="mb-6 space-y-2">
                        <div>
                            <Image src={logo} alt="Create Account" className="h-16 w-16 rounded-full mx-auto" />
                        </div>
                        <div className="text-center mb-2">
                            <h1 className="mb-1 text-xl font-semibold">Create Account</h1>
                            <p className="text-slate-500 text-sm">Set up your Panda Laundry profile</p>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={submit} noValidate>
                        {/* fullname */}
                        <FormField
                            htmlFor="fullName"
                            label="Full Name"
                            info="Enter your first and last name..."
                            error={errors.fullName}
                        >
                            <input
                                id="fullName"
                                className={formControlClass}
                                placeholder="fullname..."
                                value={values.fullName}
                                onChange={(event) => setField("fullName", event.target.value)}
                            />
                        </FormField>

                        {/* email */}
                        <FormField
                            htmlFor="email"
                            label="Email"
                            info="Enter your email address..."
                            error={errors.email}
                        >
                            <div className={iconInputWrapperClass}>
                                <MailIcon className="h-5 w-5 text-slate-500" />
                                <input
                                    id="email"
                                    className="w-full bg-transparent text-sm outline-none"
                                    placeholder="reenjugush@gmail.com"
                                    value={values.email}
                                    onChange={(event) => setField("email", event.target.value)}
                                />
                            </div>
                        </FormField>

                        {/* phone number */}
                        <FormField
                            htmlFor="phone"
                            label="Phone"
                            info="Add phone number with country code. e.g +2547XXXXXXXX"
                            error={errors.phone}
                        >
                            <input
                                id="phone"
                                className={formControlClass}
                                placeholder="Enter your phone number..."
                                value={values.phone}
                                onChange={(event) => setField("phone", event.target.value)}
                            />
                        </FormField>

                        {/* password */}
                        <FormField
                            htmlFor="password"
                            label="Password"
                            info="Use a strong password of upto 8 digits, including letters and numbers."
                            error={errors.password}
                        >
                            <div className={iconInputWrapperClass}>
                                <LockIcon className="h-5 w-5 text-slate-500" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-transparent text-sm outline-none"
                                    placeholder="Enter your password..."
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

                        {/* confirm password */}
                        <FormField
                            htmlFor="confirmPassword"
                            label="Confirm Password"
                            info="Must match password"
                            error={errors.confirmPassword}
                        >
                            <div className={iconInputWrapperClass}>
                                <LockIcon className="h-5 w-5 text-slate-500" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="w-full bg-transparent text-sm outline-none"
                                    placeholder="Confirm your password again..."
                                    value={values.confirmPassword}
                                    onChange={(event) => setField("confirmPassword", event.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="text-slate-500 transition hover:text-slate-700"
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    aria-pressed={showConfirmPassword}
                                >
                                    {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </FormField>

                        {/* role */}
                        <FormField
                            htmlFor="role"
                            label="Role"
                            info="Default role set to admin"
                            error={errors.role}
                        >
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

                        <button
                            className="w-full rounded-lg bg-blue-800 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 mt-2"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating Account..." : "Sign Up"}
                        </button>

                                      <div className="flex items-center gap-2 text-slate-400 my-4">
                            <hr className="flex-1 border-slate-300" />
                            <span className="text-xs">OR CONTINUE WITH</span>
                            <hr className="flex-1 border-slate-300" />
                        </div>

                        {/* social logins */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                type="button"
                                aria-label="Continue with Google"
                                onClick={() => window.location.assign(getGoogleSignupUrl())}
                            >
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
                            <button
                                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                type="button"
                                aria-label="Continue with Apple"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="h-4 w-4" aria-hidden="true">
                                    <path d="M319.1 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7-55.8 .9-115.1 44.5-115.1 133.2 0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.5 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>

                                Apple
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-500">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-blue-700">
                                Login
                            </Link>
                        </p>
                    </form>
                </SoftCard>
            </div>
        </MobileLayout>
    );
}
