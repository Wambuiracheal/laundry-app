import { API_BASE_URL, postJson } from "@/utils/apiClient";
import type { LoginValues } from "@/utils/loginValidation";
import type { RegisterValues } from "@/utils/registerValidation";

const GOOGLE_LOGIN_PATH = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_PATH ?? "/auth/login/google";
const GOOGLE_SIGNUP_PATH = process.env.NEXT_PUBLIC_GOOGLE_SIGNUP_PATH ?? "/auth/signup/google";

if (!process.env.NEXT_PUBLIC_GOOGLE_LOGIN_PATH || !process.env.NEXT_PUBLIC_GOOGLE_SIGNUP_PATH) {
  console.warn(
    "Environment variables NEXT_PUBLIC_GOOGLE_LOGIN_PATH and NEXT_PUBLIC_GOOGLE_SIGNUP_PATH are not set. Using default paths."
  );
}

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
  return postJson<AuthResponse>("/auth/login", {
    email: payload.email,
    password: payload.password,
  });
}

export async function signup(payload: RegisterValues): Promise<AuthResponse> {
  return postJson<AuthResponse>("/auth/signup", {
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
