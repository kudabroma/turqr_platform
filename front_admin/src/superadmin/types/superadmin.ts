export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  plan: string | null;
  paid_until: string | null;
  created_at: string;
}

export interface BusinessUser {
  id: number;
  username: string;
  email: string;
  restaurant: string;
  restaurant_id: number;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: number;
  restaurant: string;
  restaurant_id: number;
  status: "trial" | "active" | "inactive";
  plan: string;
  paid_until: string | null;
}

export interface Payment {
  id: number;
  restaurant: string;
  amount: number;
  currency: string;
  provider: string;
  status: "success" | "pending" | "failed" | "refund";
  created_at: string;
}

export interface CreateRestaurantPayload {
  name: string;
  slug: string;
}

export interface CreateBusinessUserPayload {
  username: string;
  restaurant_id: number;
  password: string;
}

export interface UpdateSubscriptionPayload {
  id: number;
  status?: Subscription["status"];
  paid_until?: string;
}
