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

const connectionErrorMessage =
  "Impossible de contacter l’API. Vérifiez son adresse publique, qu’elle est démarrée et que CORS autorise https://zo-print.vercel.app.";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  const baseUrl = getApiBaseUrl();
  try {
    response = await fetch(`${baseUrl}${path}`, {
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
  } catch {
    throw new ApiError(connectionErrorMessage);
  }

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
  let response: Response;
  const baseUrl = getApiBaseUrl();
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { Accept: "image/*", ...init.headers },
    });
  } catch {
    throw new ApiError(connectionErrorMessage);
  }

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
