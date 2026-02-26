// TODO: Replace all mock data with real Django/DRF API calls
import type {
  Restaurant,
  BusinessUser,
  Subscription,
  Payment,
  CreateRestaurantPayload,
  CreateBusinessUserPayload,
  UpdateSubscriptionPayload,
} from "@/superadmin/types/superadmin";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

let restaurants: Restaurant[] = [
  { id: 1, name: "Kebab Palace", slug: "kebab-palace", active: true, plan: "premium", paid_until: "2025-12-31", created_at: "2024-06-01" },
  { id: 2, name: "Sushi Garden", slug: "sushi-garden", active: true, plan: "basic", paid_until: "2025-08-15", created_at: "2024-07-12" },
  { id: 3, name: "Pizza Roma", slug: "pizza-roma", active: false, plan: null, paid_until: null, created_at: "2024-09-20" },
  { id: 4, name: "Burger Barn", slug: "burger-barn", active: true, plan: "trial", paid_until: "2025-04-01", created_at: "2025-01-05" },
  { id: 5, name: "Thai Orchid", slug: "thai-orchid", active: true, plan: "premium", paid_until: "2026-01-20", created_at: "2024-03-18" },
];

let businessUsers: BusinessUser[] = [
  { id: 1, username: "ali@kebabpalace.com", email: "ali@kebabpalace.com", restaurant: "Kebab Palace", restaurant_id: 1, is_active: true, created_at: "2024-06-01" },
  { id: 2, username: "yuki@sushigarden.com", email: "yuki@sushigarden.com", restaurant: "Sushi Garden", restaurant_id: 2, is_active: true, created_at: "2024-07-12" },
  { id: 3, username: "marco@pizzaroma.com", email: "marco@pizzaroma.com", restaurant: "Pizza Roma", restaurant_id: 3, is_active: false, created_at: "2024-09-20" },
];

let subscriptions: Subscription[] = [
  { id: 1, restaurant: "Kebab Palace", restaurant_id: 1, status: "active", plan: "premium", paid_until: "2025-12-31" },
  { id: 2, restaurant: "Sushi Garden", restaurant_id: 2, status: "active", plan: "basic", paid_until: "2025-08-15" },
  { id: 3, restaurant: "Pizza Roma", restaurant_id: 3, status: "inactive", plan: "basic", paid_until: null },
  { id: 4, restaurant: "Burger Barn", restaurant_id: 4, status: "trial", plan: "trial", paid_until: "2025-04-01" },
  { id: 5, restaurant: "Thai Orchid", restaurant_id: 5, status: "active", plan: "premium", paid_until: "2026-01-20" },
];

const payments: Payment[] = [
  { id: 1, restaurant: "Kebab Palace", amount: 49.99, currency: "USD", provider: "stripe", status: "success", created_at: "2025-01-15" },
  { id: 2, restaurant: "Sushi Garden", amount: 29.99, currency: "USD", provider: "stripe", status: "success", created_at: "2025-01-10" },
  { id: 3, restaurant: "Burger Barn", amount: 49.99, currency: "USD", provider: "paypal", status: "pending", created_at: "2025-02-01" },
  { id: 4, restaurant: "Thai Orchid", amount: 49.99, currency: "USD", provider: "stripe", status: "success", created_at: "2025-02-10" },
  { id: 5, restaurant: "Pizza Roma", amount: 29.99, currency: "USD", provider: "stripe", status: "failed", created_at: "2025-01-20" },
  { id: 6, restaurant: "Kebab Palace", amount: 49.99, currency: "USD", provider: "stripe", status: "refund", created_at: "2024-12-01" },
];

let nextRestaurantId = 6;
let nextUserId = 4;

// TODO: Replace with GET /api/superadmin/restaurants/
export async function getRestaurants(): Promise<Restaurant[]> {
  await delay();
  return [...restaurants];
}

// TODO: Replace with POST /api/superadmin/restaurants/
export async function createRestaurant(data: CreateRestaurantPayload): Promise<Restaurant> {
  await delay();
  const r: Restaurant = {
    id: nextRestaurantId++,
    name: data.name,
    slug: data.slug,
    active: true,
    plan: null,
    paid_until: null,
    created_at: new Date().toISOString().split("T")[0],
  };
  restaurants = [...restaurants, r];
  return r;
}

// TODO: Replace with GET /api/superadmin/users/
export async function getBusinessUsers(): Promise<BusinessUser[]> {
  await delay();
  return [...businessUsers];
}

// TODO: Replace with POST /api/superadmin/users/
export async function createBusinessUser(data: CreateBusinessUserPayload): Promise<BusinessUser> {
  await delay();
  const rest = restaurants.find((r) => r.id === data.restaurant_id);
  const u: BusinessUser = {
    id: nextUserId++,
    username: data.username,
    email: data.username,
    restaurant: rest?.name ?? "Unknown",
    restaurant_id: data.restaurant_id,
    is_active: true,
    created_at: new Date().toISOString().split("T")[0],
  };
  businessUsers = [...businessUsers, u];
  return u;
}

// TODO: Replace with POST /api/superadmin/users/{id}/reset-password/
export async function resetBusinessUserPassword(_userId: number, _newPassword: string): Promise<void> {
  await delay();
}

// TODO: Replace with PATCH /api/superadmin/users/{id}/
export async function toggleBusinessUserActive(userId: number): Promise<void> {
  await delay();
  businessUsers = businessUsers.map((u) =>
    u.id === userId ? { ...u, is_active: !u.is_active } : u
  );
}

// TODO: Replace with GET /api/superadmin/subscriptions/
export async function getSubscriptions(): Promise<Subscription[]> {
  await delay();
  return [...subscriptions];
}

// TODO: Replace with PATCH /api/superadmin/subscriptions/{id}/
export async function updateSubscription(data: UpdateSubscriptionPayload): Promise<Subscription> {
  await delay();
  let updated: Subscription | undefined;
  subscriptions = subscriptions.map((s) => {
    if (s.id === data.id) {
      updated = { ...s, ...data };
      return updated;
    }
    return s;
  });
  return updated!;
}

// TODO: Replace with GET /api/superadmin/payments/
export async function getPaymentHistory(): Promise<Payment[]> {
  await delay();
  return [...payments];
}

export function generatePassword(length = 16): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
