export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const configuredApiBaseUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = (
  configuredApiBaseUrl ??
  (import.meta.env.DEV ? "http://localhost:3001/api/v1" : "")
).replace(/\/$/, "");
const API_REQUEST_TIMEOUT_MS = 20_000;
const AUTH_SESSION_KEY = "makart-auth-session";

interface StoredAuthSession {
  user: {
    id: string;
    roles: string[];
    [key: string]: unknown;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    [key: string]: unknown;
  };
}

let refreshInFlight: Promise<StoredAuthSession | null> | null = null;

function getApiBaseUrl(): string {
  if (!apiBaseUrl) {
    throw new ApiError(
      "L’API n’est pas configurée pour ce déploiement. Définissez VITE_API_URL avec l’adresse publique de l’API, terminée par /api/v1, puis redéployez.",
    );
  }
  if (import.meta.env.PROD) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(apiBaseUrl);
    } catch {
      throw new ApiError(
        "VITE_API_URL doit être une URL HTTPS publique complète, terminée par /api/v1.",
      );
    }
    if (parsedUrl.protocol !== "https:") {
      throw new ApiError(
        "L’API doit utiliser HTTPS pour être appelée depuis le site Vercel.",
      );
    }
    if (
      ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedUrl.hostname)
    ) {
      throw new ApiError(
        "VITE_API_URL pointe vers localhost, inaccessible depuis Vercel. Configurez l’adresse HTTPS publique de votre API puis redéployez.",
      );
    }
    if (!parsedUrl.pathname.replace(/\/+$/, "").endsWith("/api/v1")) {
      throw new ApiError(
        "VITE_API_URL doit se terminer par /api/v1 pour joindre les routes de l’API.",
      );
    }
  }
  return apiBaseUrl;
}

function getConnectionErrorMessage(): string {
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "l'origine du site";
  return `Impossible de contacter l’API. Vérifiez son adresse publique, qu’elle est démarrée et que CORS autorise ${currentOrigin}.`;
}

async function fetchApi(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const callerSignal = init.signal;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort(callerSignal?.reason);

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    if (timedOut) {
      throw new ApiError(
        "Le serveur met trop de temps à répondre. Vérifiez que l’API est démarrée, puis réessayez.",
        408,
      );
    }
    throw new ApiError(getConnectionErrorMessage());
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}

function readStoredAuthSession(): StoredAuthSession | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Partial<StoredAuthSession>;
    return session.user?.id &&
      Array.isArray(session.user.roles) &&
      session.tokens?.accessToken &&
      session.tokens?.refreshToken
      ? (session as StoredAuthSession)
      : null;
  } catch {
    return null;
  }
}

function dispatchAuthSessionEvent(name: string, detail?: StoredAuthSession) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

async function refreshStoredAuthSession(
  baseUrl: string,
): Promise<StoredAuthSession | null> {
  if (refreshInFlight) return refreshInFlight;

  const session = readStoredAuthSession();
  if (!session) return null;

  refreshInFlight = (async () => {
    const response = await fetchApi(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: session.tokens.refreshToken }),
    });

    const raw = await response.text();
    let payload: unknown;
    try {
      payload = raw ? (JSON.parse(raw) as unknown) : undefined;
    } catch {
      payload = undefined;
    }

    if (response.status === 401) {
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      dispatchAuthSessionEvent("auth-session-invalidated");
      return null;
    }
    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? Array.isArray(payload.message)
            ? payload.message.join(" ")
            : typeof payload.message === "string"
              ? payload.message
              : undefined
          : undefined;
      throw new ApiError(message ?? "Le renouvellement de session a échoué.", response.status);
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      !("user" in payload) ||
      !("tokens" in payload)
    ) {
      throw new ApiError("La réponse de renouvellement de session est invalide.");
    }
    const updated = payload as StoredAuthSession;
    if (
      !updated.user?.id ||
      !Array.isArray(updated.user.roles) ||
      !updated.tokens?.accessToken ||
      !updated.tokens?.refreshToken
    ) {
      throw new ApiError("La réponse de renouvellement de session est invalide.");
    }

    window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
    dispatchAuthSessionEvent("auth-session-updated", updated);
    return updated;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function fetchWithAuthRefresh(
  baseUrl: string,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const response = await fetchApi(`${baseUrl}${path}`, init);
  const headers = new Headers(init.headers);
  const hasBearer = headers.get("Authorization")?.startsWith("Bearer ");
  const isRefreshRequest = path === "/auth/refresh";
  if (response.status !== 401 || !hasBearer || isRefreshRequest) {
    return response;
  }

  const session = await refreshStoredAuthSession(baseUrl);
  if (!session) return response;

  headers.set("Authorization", `Bearer ${session.tokens.accessToken}`);
  return fetchApi(`${baseUrl}${path}`, { ...init, headers });
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithAuthRefresh(baseUrl, path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body &&
      !(typeof FormData !== "undefined" && init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const raw = await response.text();
  let payload: unknown;
  try {
    payload = raw ? (JSON.parse(raw) as unknown) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(" ")
          : typeof payload.message === "string"
            ? payload.message
            : undefined
        : undefined;
    throw new ApiError(message ?? "Une erreur est survenue.", response.status);
  }
  return payload as T;
}

export async function apiBlobRequest(
  path: string,
  init: RequestInit = {},
): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const response = await fetchWithAuthRefresh(baseUrl, path, {
    ...init,
    headers: { Accept: "image/*", ...init.headers },
  });

  if (!response.ok) {
    const raw = await response.text();
    let payload: unknown;
    try {
      payload = raw ? (JSON.parse(raw) as unknown) : undefined;
    } catch {
      payload = undefined;
    }
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(" ")
          : typeof payload.message === "string"
            ? payload.message
            : undefined
        : undefined;
    throw new ApiError(
      message ?? "La photo de profil n’a pas pu être chargée.",
      response.status,
    );
  }

  return response.blob();
}

export const withBearer = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
});
