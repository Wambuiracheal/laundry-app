"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "@/components/mobile/icons";
import { MobileLayout, SoftCard } from "@/components/mobile/primitives";
import {
    FormField,
    FormStatusMessage,
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

            setStatus(result.message || "Account created successfully. You can now log in.");
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
                            info="+254..."
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
                            className="w-full rounded-lg bg-blue-800 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating Account..." : "Sign Up"}
                        </button>

                        <button
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={isSubmitting}
                        >
                            Continue with Google
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-blue-700">
                                Login
                            </Link>
                        </p>

                        {status ? <FormStatusMessage message={status} /> : null}
                    </form>
                </SoftCard>
            </div>
        </MobileLayout>
    );
}
