"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getMe, login as loginRequest, logout as logoutRequest, signup as signupRequest } from "@/utils/authApi";
import { setUnauthorizedHandler } from "@/utils/apiClient";
import { clearSession, loadSession, saveSession, type SessionUser } from "@/utils/session";
import { useToast } from "@/components/shared/toast/ToastProvider";
import type { LoginValues } from "@/utils/loginValidation";
import type { RegisterValues } from "@/utils/registerValidation";

type AuthApi = {
  user: SessionUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (values: LoginValues) => Promise<void>;
  signup: (values: RegisterValues) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthApi | null>(null);

type AuthState = {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
};

const INITIAL_STATE: AuthState = { user: null, accessToken: null, refreshToken: null, isLoading: true };

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
      toast.error("Your session has expired. Please log in again.");
      router.replace("/login");
    });

    return () => setUnauthorizedHandler(null);
  }, [router, toast]);

  useEffect(() => {
    // One-time hydration from localStorage: must run client-side post-mount (this
    // is a static-export app, so `window` doesn't exist during prerendering) and
    // runs after the initial hydration paint, so it can't cause a mismatch.
    const session = loadSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      isLoading: false,
    });
  }, []);

  const establishSession = useCallback(async (tokens: { accessToken: string; refreshToken: string }) => {
    const profile = await getMe(tokens.accessToken);
    saveSession({ ...tokens, user: profile });
    setState({ user: profile, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isLoading: false });
  }, []);

  const login = useCallback(
    async (values: LoginValues) => {
      const result = await loginRequest(values);
      if (!result.accessToken || !result.refreshToken) {
        throw new Error("Login response did not include tokens.");
      }
      await establishSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    },
    [establishSession],
  );

  const signup = useCallback(
    async (values: RegisterValues) => {
      const result = await signupRequest(values);
      if (!result.accessToken || !result.refreshToken) {
        throw new Error("Signup response did not include tokens.");
      }
      await establishSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    const currentRefreshToken = state.refreshToken;
    if (currentRefreshToken) {
      await logoutRequest(currentRefreshToken).catch(() => null);
    }
    clearSession();
    setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    router.replace("/login");
  }, [state.refreshToken, router]);

  const api = useMemo<AuthApi>(
    () => ({ user: state.user, accessToken: state.accessToken, isLoading: state.isLoading, login, signup, logout }),
    [state.user, state.accessToken, state.isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
