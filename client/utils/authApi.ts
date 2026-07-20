import { postJson } from "@/utils/apiClient";
import type { LoginValues } from "@/utils/loginValidation";
import type { RegisterValues } from "@/utils/registerValidation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const GOOGLE_LOGIN_PATH = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_PATH ?? "/api/auth/login/google";
const GOOGLE_SIGNUP_PATH = process.env.NEXT_PUBLIC_GOOGLE_SIGNUP_PATH ?? "/api/auth/signup/google";

export type AuthResponse = {
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    fullName?: string;
    email: string;
  };
};

export async function login(payload: LoginValues): Promise<AuthResponse> {
  return postJson<AuthResponse>("/api/auth/login", {
    email: payload.email,
    password: payload.password,
  });
}

export async function signup(payload: RegisterValues): Promise<AuthResponse> {
  return postJson<AuthResponse>("/api/auth/signup", {
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    role: payload.role,
  });
}

export function getGoogleSignupUrl(): string {
  return `${API_BASE_URL}${GOOGLE_SIGNUP_PATH}`;
}

export function getGoogleLoginUrl(): string {
  return `${API_BASE_URL}${GOOGLE_LOGIN_PATH}`;
}
