import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  type AuthResponse,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  type UpdateUserProfileInput,
  type UserProfile,
} from "@/lib/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  updateProfile: (input: UpdateUserProfileInput) => Promise<UserProfile>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  const establish = useCallback((response: AuthResponse) => {
    saveAuthSession(response);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      const session = readAuthSession();
      if (!session) {
        if (mounted) setStatus("unauthenticated");
        return;
      }
      try {
        const response = await authApi.refresh(session.tokens.refreshToken);
        if (mounted) establish(response);
      } catch {
        clearAuthSession();
        if (mounted) setStatus("unauthenticated");
      }
    };
    void restore();
    return () => {
      mounted = false;
    };
  }, [establish]);

  const login = useCallback(
    async (input: LoginInput) => establish(await authApi.login(input)),
    [establish],
  );
  const register = useCallback(
    async (input: RegisterInput) => establish(await authApi.register(input)),
    [establish],
  );
  const logout = useCallback(async () => {
    const session = readAuthSession();
    try {
      if (session) await authApi.logout(session.tokens.accessToken);
    } finally {
      clearAuthSession();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);
  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      const session = readAuthSession();
      if (!session)
        throw new Error("Votre session a expiré. Connectez-vous à nouveau.");
      await authApi.changePassword(session.tokens.accessToken, input);
      clearAuthSession();
      setUser(null);
      setStatus("unauthenticated");
    },
    [],
  );

  const updateProfile = useCallback(async (input: UpdateUserProfileInput) => {
    const session = readAuthSession();
    if (!session)
      throw new Error("Votre session a expiré. Connectez-vous à nouveau.");
    const profile = await authApi.updateProfile(
      session.tokens.accessToken,
      input,
    );
    saveAuthSession({ ...session, user: profile });
    setUser(profile);
    return profile;
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      register,
      logout,
      changePassword,
      updateProfile,
    }),
    [changePassword, login, logout, register, status, updateProfile, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
