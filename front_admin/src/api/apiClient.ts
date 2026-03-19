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

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

// --- Token helpers ---
export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}
export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  return data.access;
}

async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const form = isFormData(body);

  const mergedHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (!form && body !== undefined) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  // JWT токен
  const token = getAccessToken();
  if (token) mergedHeaders["Authorization"] = `Bearer ${token}`;

  const config: RequestInit = {
    method,
    headers: mergedHeaders,
  };

  if (body !== undefined) {
    config.body = form ? (body as FormData) : JSON.stringify(body);
  }

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // Токен протух — пробуем refresh
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      mergedHeaders["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${endpoint}`, { ...config, headers: mergedHeaders });
    }
  }

  if (response.status === 204) return undefined as T;

  let data: unknown = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try { data = await response.json(); } catch { data = null; }
  } else {
    try { data = await response.text(); } catch { data = null; }
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