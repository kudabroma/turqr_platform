import apiClient from "./apiClient";

// =====================
// Types
// =====================

export interface User {
  id: number;
  username: string;
  restaurant: number | null;
}

export interface Category {
  id: number;
  name: string;
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  category: number;
  category_name?: string;
}

export interface CreateCategoryData {
  name: string;
}

export interface UpdateCategoryData {
  name: string;
}

export interface CreateDishData {
  name: string;
  description: string;
  price: string;
  category: number;
}

export interface UpdateDishData {
  name?: string;
  description?: string;
  price?: string;
  category?: number;
}

// =====================
// Auth endpoints
// =====================

export const authApi = {
  login: (username: string, password: string) =>
    apiClient<User>("/auth/login/", {
      method: "POST",
      body: { username, password },
    }),

  logout: () =>
    apiClient<void>("/auth/logout/", {
      method: "POST",
    }),

  // ✅ НОВЫЙ ENDPOINT
  me: () =>
    apiClient<User>("/auth/me/", {
      method: "GET",
    }),
};

// =====================
// Categories endpoints
// =====================

export const categoriesApi = {
  list: () => apiClient<Category[]>("/categories/"),

  create: (data: CreateCategoryData) =>
    apiClient<Category>("/categories/", {
      method: "POST",
      body: data,
    }),

  update: (id: number, data: UpdateCategoryData) =>
    apiClient<Category>(`/categories/${id}/`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: number) =>
    apiClient<void>(`/categories/${id}/`, {
      method: "DELETE",
    }),
};

// =====================
// Dishes endpoints
// =====================

export const dishesApi = {
  list: () => apiClient<Dish[]>("/dishes/"),

  create: (data: CreateDishData) =>
    apiClient<Dish>("/dishes/", {
      method: "POST",
      body: data,
    }),

  update: (id: number, data: UpdateDishData) =>
    apiClient<Dish>(`/dishes/${id}/`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: number) =>
    apiClient<void>(`/dishes/${id}/`, {
      method: "DELETE",
    }),
};
