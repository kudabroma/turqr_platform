/**
 * API Client for TurQR Admin
 * SessionAuthentication (cookies) + CSRF header for unsafe methods.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

// --- CSRF helper ---
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function isUnsafe(method: string) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const form = isFormData(body);

  // ✅ Собираем headers один раз, без "магии" потом
  const mergedHeaders: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    ...headers,
  };

  // ✅ Если FormData — Content-Type нельзя ставить НИКОГДА (сломает boundary)
  if (form && "Content-Type" in mergedHeaders) {
    delete mergedHeaders["Content-Type"];
  }

  // ✅ JSON: выставляем Content-Type
  if (!form && body !== undefined) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  // ✅ CSRF для unsafe
  if (isUnsafe(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) mergedHeaders["X-CSRFToken"] = csrf;
  }

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: mergedHeaders,
  };

  if (body !== undefined) {
    config.body = form ? (body as FormData) : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 204) return undefined as T;

  let data: unknown = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const msg =
      typeof data === "object" && data !== null
        ? JSON.stringify(data)
        : String(data) || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, msg, data);
  }

  return data as T;
}

export function apiFetch<T>(path: string) {
  return apiClient<T>(path, { method: "GET" });
}

export default apiClient;