import apiClient, { apiFetch } from "./apiClient";

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
  is_system?: boolean;
  restaurant?: number;
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: string; // DRF часто отдаёт как string
  category: number;
  restaurant?: number;
  category_name?: string;
}

export interface RestaurantMe {
  id: number;
  name: string;
  slug: string;
  contacts: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  front_template: string;
  active: boolean;
  plan: string;
  paid_until: string | null;

  // если у тебя уже добавлены поля фото ресторана на бэке — можно типизировать тут (не обязательно)
  // photo1_url?: string | null;
  // photo2_url?: string | null;
  // photo3_url?: string | null;
  // photo4_url?: string | null;
  // photo5_url?: string | null;
  // photo6_url?: string | null;
}

// /api/menu/ -> список категорий с dishes
export interface CategoryWithDishes extends Category {
  dishes: Dish[];
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
// Menu endpoint
// =====================

export const menuApi = {
  get: () => apiClient<CategoryWithDishes[]>("/menu/"),
};

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

  me: () =>
    apiClient<User>("/auth/me/", {
      method: "GET",
    }),
};

// =====================
// Restaurant endpoints
// =====================

export const restaurantApi = {
  me: () => apiFetch<RestaurantMe>("/restaurants/me/"),

  update: (data: Partial<RestaurantMe>) =>
    apiClient<RestaurantMe>("/restaurants/me/", {
      method: "PATCH",
      body: data,
    }),

  // ✅ multipart (logo/photo1..photo6)
  updateForm: (fd: FormData) =>
    apiClient<RestaurantMe>("/restaurants/me/", {
      method: "PATCH",
      body: fd,
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

  // ✅ multipart (image)
  createForm: (fd: FormData) =>
    apiClient<Dish>("/dishes/", {
      method: "POST",
      body: fd,
    }),

  updateForm: (id: number, fd: FormData) =>
    apiClient<Dish>(`/dishes/${id}/`, {
      method: "PATCH",
      body: fd,
    }),
};