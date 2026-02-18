/**
 * API Client for TurQR Admin
 * SessionAuthentication (cookies) + CSRF header for unsafe methods.
 */

const API_BASE = "/api";

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

async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...headers,
    },
  };

  // add CSRF header for unsafe requests
  if (isUnsafe(method)) {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      (config.headers as Record<string, string>)["X-CSRFToken"] = csrf;
    }
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 204) return undefined as T;

  let data: unknown;
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
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
