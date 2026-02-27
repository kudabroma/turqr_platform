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

  // display name (для табов/вьюхи меню); public/menu обычно отдаёт только это
  name: string;

  // bilingual fields (для CRUD)
  name_tr?: string;
  name_en?: string;

  is_system?: boolean;
  restaurant?: number;
}

export interface Dish {
  id: number;

  // display fields (из /menu/)
  name: string;
  description: string;

  // bilingual fields (для CRUD)
  name_tr?: string;
  name_en?: string;
  description_tr?: string;
  description_en?: string;

  price: string; // DRF часто отдаёт как string
  category: number;
  restaurant?: number;

  // optional helpers
  category_name?: string;
  image?: string | null;
  image_url?: string | null;
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
}

// /api/menu/ -> список категорий с dishes
export interface CategoryWithDishes extends Category {
  dishes: Dish[];
}

// =====================
// Payload Types (CRUD)
// =====================

export interface CreateCategoryData {
  name_tr: string;
  name_en?: string;
}

export interface UpdateCategoryData {
  name_tr?: string;
  name_en?: string;
}

export interface CreateDishData {
  name_tr: string;
  name_en?: string;
  description_tr?: string;
  description_en?: string;
  price: string;
  category: number;
}

export interface UpdateDishData {
  name_tr?: string;
  name_en?: string;
  description_tr?: string;
  description_en?: string;
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

  get: (id: number) => apiClient<Category>(`/categories/${id}/`),

  create: (data: CreateCategoryData) =>
    apiClient<Category>("/categories/", {
      method: "POST",
      body: data,
    }),

/**
 * PATCH /categories/:id/
 * передавай name_tr/name_en
 */
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

  // ✅ важно для заполнения модалки bilingual полями
  get: (id: number) => apiClient<Dish>(`/dishes/${id}/`),

  create: (data: CreateDishData) =>
    apiClient<Dish>("/dishes/", {
      method: "POST",
      body: data,
    }),

/**
 * PATCH /dishes/:id/
 * передавай bilingual поля
 */
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