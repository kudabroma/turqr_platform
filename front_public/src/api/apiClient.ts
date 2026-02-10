type ApiError = {
    status: number;
    message: string;
    data?: unknown;
  };
  
  export async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include", // 🔐 ВАЖНЕЙШАЯ СТРОКА
    });
  
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // ignore if no json
    }
  
    if (!res.ok) {
      const err: ApiError = {
        status: res.status,
        message: data?.detail || data?.message || "Request failed",
        data,
      };
      throw err;
    }
  
    return data as T;
  }
  