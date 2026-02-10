import { apiRequest } from "./apiClient";

export const AuthAPI = {
  login: (username: string, password: string) =>
    apiRequest("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    apiRequest("/api/auth/logout/", {
      method: "POST",
    }),
};

export const AdminAPI = {
  categories: () => apiRequest("/api/categories/"),
  dishes: () => apiRequest("/api/dishes/"),
};