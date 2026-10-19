export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1"
).replace(/\/$/, "");

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
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
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez que l’API est démarrée.",
    );
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
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: { Accept: "image/*", ...init.headers },
    });
  } catch {
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez que l’API est démarrée.",
    );
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
