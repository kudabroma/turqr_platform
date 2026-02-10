/**
 * API Client for TurQR Admin
 * 
 * All requests use credentials: "include" for session-based authentication.
 * The Django backend uses SessionAuthentication (cookie-based).
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

async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    credentials: "include", // Critical for session auth
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle empty responses (204 No Content, etc.)
  if (response.status === 204) {
    return undefined as T;
  }

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
    const errorMessage = typeof data === "object" && data !== null
      ? JSON.stringify(data)
      : String(data) || `Request failed with status ${response.status}`;
    
    throw new ApiError(response.status, errorMessage, data);
  }

  return data as T;
}

export default apiClient;
