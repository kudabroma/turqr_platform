// src/superadmin/api/superadmin.ts
// Super Admin API layer
// Restaurants + Business Users: REAL Django/DRF API (SessionAuth + CSRF)
// Subscriptions / Payments: mock for now

import type {
  Restaurant,
  BusinessUser,
  Subscription,
  Payment,
  CreateRestaurantPayload,
  CreateBusinessUserPayload,
  UpdateSubscriptionPayload,
} from "@/superadmin/types/superadmin";

/* =========================
   Helpers
   ========================= */

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function isUnsafe(method?: string) {
  const m = (method || "GET").toUpperCase();
  return ["POST", "PUT", "PATCH", "DELETE"].includes(m);
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const method = (options?.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    ...(options?.headers as any),
  };

  if (!headers["Content-Type"] && options?.body) {
    headers["Content-Type"] = "application/json";
  }

  // ✅ JWT токен вместо CSRF
  const token = localStorage.getItem("access_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const BASE = import.meta.env.VITE_API_URL ?? "";

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Backend returns restaurant:
 * { id, name, slug, plan, paid_until, created_at, active? }
 */
function normalizeRestaurant(raw: any): Restaurant {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    active: typeof raw.active === "boolean" ? raw.active : true,
    plan: raw.plan ?? null,
    paid_until: raw.paid_until ?? null,
    created_at: raw.created_at ?? raw.created ?? raw.createdAt ?? null,
  };
}

/**
 * Backend returns user:
 * {
 *   id, email, display_email, first_name, last_name,
 *   is_active, date_joined, last_login,
 *   restaurant: {id,name,slug} | null
 * }
 *
 * But our UI/types may use restaurant as string OR object -> keep it flexible.
 */
function normalizeBusinessUser(raw: any): BusinessUser {
  const restaurantObj = raw.restaurant ?? null;

  // Choose username/email for display (UI uses u.username)
  const username =
    raw.display_email ||
    raw.email ||
    raw.username ||
    "";

  // Convert restaurant for UI (keep object if your types allow it, otherwise fallback to name string)
  // We'll keep object if present, but if UI expects string, it can render typeof === 'string' ? ... : .name
  const restaurant = restaurantObj
    ? {
        id: restaurantObj.id,
        name: restaurantObj.name,
        slug: restaurantObj.slug,
      }
    : null;

  // created_at: UI expects created_at string
  const createdAt = raw.date_joined || raw.created_at || raw.created || null;

  return {
    id: raw.id,
    username,
    email: raw.email || username,
    restaurant: restaurant as any, // allow RestaurantMini | string | null depending on your types
    restaurant_id: restaurantObj?.id ?? null,
    is_active: !!raw.is_active,
    created_at: createdAt,
  };
}

/* =========================
   REAL API: Restaurants
   ========================= */

export async function getRestaurants(): Promise<Restaurant[]> {
  const data = await api<any[]>("/superadmin/restaurants/");
  return data.map(normalizeRestaurant);
}

export async function createRestaurant(data: CreateRestaurantPayload): Promise<Restaurant> {
  const created = await api<any>("/superadmin/restaurants/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeRestaurant(created);
}

/* =========================
   REAL API: Business Users
   ========================= */

export async function getBusinessUsers(): Promise<BusinessUser[]> {
  const data = await api<any[]>("/superadmin/users/");
  return data.map(normalizeBusinessUser);
}

export async function createBusinessUser(data: CreateBusinessUserPayload): Promise<BusinessUser> {
  // Backend expected payload: { username/email, restaurant_id, password }
  const created = await api<any>("/superadmin/users/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeBusinessUser(created);
}

/**
 * Action endpoint (recommended):
 * POST /api/superadmin/users/<id>/toggle-active/
 * returns updated user OR 204
 */
export async function toggleBusinessUserActive(userId: number): Promise<void> {
  await api(`/api/superadmin/users/${userId}/toggle-active/`, {
    method: "PATCH",
    body: JSON.stringify({}), // можно пустое тело
  });
}
export async function deleteRestaurant(id: number) {
  return api(`/api/superadmin/restaurants/${id}/`, {
    method: "DELETE",
  });
}
export async function toggleRestaurantActive(id: number) {
  return api(`/api/superadmin/restaurants/${id}/toggle-active/`, {
    method: "PATCH",
  });
}
/**
 * Action endpoint:
 * POST /api/superadmin/users/<id>/reset-password/
 * payload: { password: "..." }
 * returns 204 or {ok:true}
 */
export async function resetBusinessUserPassword(userId: number, newPassword: string): Promise<void> {
  await api<void>(`/api/superadmin/users/${userId}/reset-password/`, {
    method: "POST",
    body: JSON.stringify({ password: newPassword }),
  });
}

/* =========================
   MOCK (for now): Subscriptions
   ========================= */

let subscriptions: Subscription[] = [];

export async function getSubscriptions(): Promise<Subscription[]> {
  await delay();
  return [...subscriptions];
}

export async function updateSubscription(data: UpdateSubscriptionPayload): Promise<Subscription> {
  await delay();
  let updated: Subscription | undefined;

  subscriptions = subscriptions.map((s) => {
    if (s.id === data.id) {
      updated = { ...s, ...data };
      return updated!;
    }
    return s;
  });

  if (!updated) {
    updated = {
      id: data.id,
      restaurant: "Unknown",
      restaurant_id: 0,
      status: (data as any).status ?? "inactive",
      plan: (data as any).plan ?? "basic",
      paid_until: (data as any).paid_until ?? null,
    };
    subscriptions = [updated, ...subscriptions];
  }

  return updated;
}

/* =========================
   MOCK (for now): Payments
   ========================= */

const payments: Payment[] = [];

export async function getPaymentHistory(): Promise<Payment[]> {
  await delay();
  return [...payments];
}
export async function extendSubscription(restaurantId: number, days: number): Promise<Restaurant> {
  const data = await api<any>(`/superadmin/restaurants/${restaurantId}/extend-subscription/`, {
    method: "POST",
    body: JSON.stringify({ days }),
  });
  return normalizeRestaurant(data);
}

/* =========================
   Utils
   ========================= */

export function generatePassword(length = 16): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
