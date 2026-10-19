import { apiBlobRequest, apiRequest, withBearer } from "@/lib/api";
export { ApiError } from "@/lib/api";

export interface AuthUser {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED";
  roles: string[];
}

export interface AuthTokens {
  tokenType: "Bearer";
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface UserProfile extends AuthUser {
  organizationName: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  about: string | null;
  hasProfilePhoto: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UpdateUserProfileInput {
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  about: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  firstName: string;
  lastName: string;
  organizationName: string;
}

const AUTH_SESSION_KEY = "makart-auth-session";

export function readAuthSession(): AuthResponse | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<AuthResponse>;
    return session.user?.id &&
      session.tokens?.accessToken &&
      session.tokens?.refreshToken
      ? (session as AuthResponse)
      : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthResponse): void {
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession(): void {
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});
export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<AuthResponse>("/auth/login", post(input)),
  register: (input: RegisterInput) =>
    apiRequest<AuthResponse>("/auth/register", post(input)),
  refresh: (refreshToken: string) =>
    apiRequest<AuthResponse>("/auth/refresh", post({ refreshToken })),
  forgotPassword: (email: string) =>
    apiRequest<void>("/auth/forgot-password", post({ email })),
  resetPassword: (input: { token: string; newPassword: string }) =>
    apiRequest<void>("/auth/reset-password", post(input)),
  logout: (accessToken: string) =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
      headers: withBearer(accessToken),
    }),
  changePassword: (
    accessToken: string,
    input: { currentPassword: string; newPassword: string },
  ) =>
    apiRequest<void>("/auth/change-password", {
      ...post(input),
      headers: withBearer(accessToken),
    }),
  updateProfile: (accessToken: string, input: UpdateUserProfileInput) =>
    apiRequest<UserProfile>("/auth/me/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),
  getUserProfile: (accessToken: string) =>
    apiRequest<UserProfile>("/auth/me/profile", {
      headers: withBearer(accessToken),
    }),
  uploadProfilePhoto: (accessToken: string, file: File) => {
    const body = new FormData();
    body.append("photo", file);
    return apiRequest<{ hasProfilePhoto: boolean }>("/auth/me/profile/photo", {
      method: "PUT",
      body,
      headers: withBearer(accessToken),
    });
  },
  getProfilePhoto: (accessToken: string) =>
    apiBlobRequest("/auth/me/profile/photo", {
      headers: withBearer(accessToken),
    }),
  deleteProfilePhoto: (accessToken: string) =>
    apiRequest<void>("/auth/me/profile/photo", {
      method: "DELETE",
      headers: withBearer(accessToken),
    }),
};

export const USER_ROLES = [
  "ADMIN",
  "COMMERCIAL",
  "PRODUCTION_MANAGER",
  "OPERATOR",
  "STOCK_MANAGER",
  "ACCOUNTANT",
  "HR_MANAGER",
  "VIEWER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  COMMERCIAL: "Commercial",
  PRODUCTION_MANAGER: "Responsable production",
  OPERATOR: "Opérateur",
  STOCK_MANAGER: "Responsable stock",
  ACCOUNTANT: "Comptable",
  HR_MANAGER: "Responsable RH",
  VIEWER: "Lecture seule",
};

export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: AuthUser["status"];
  roles: UserRole[];
  createdAt: string;
}

export interface CreateMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  temporaryPassword: string;
  roles: UserRole[];
}

export const usersApi = {
  list: (accessToken: string) =>
    apiRequest<ManagedUser[]>("/users", {
      headers: withBearer(accessToken),
    }),
  create: (accessToken: string, input: CreateMemberInput) =>
    apiRequest<ManagedUser>("/users", {
      method: "POST",
      body: JSON.stringify(input),
      headers: withBearer(accessToken),
    }),

  updateRoles: (accessToken: string, userId: string, roles: string[]) =>
    apiRequest<ManagedUser>(`/users/${userId}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles }),
      headers: withBearer(accessToken),
    }),
};
