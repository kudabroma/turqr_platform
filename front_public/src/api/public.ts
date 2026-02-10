const API_PREFIX = "/api";

export async function fetchPublicMenu() {
  const res = await fetch(`${API_PREFIX}/public/menu/`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPublicRestaurant() {
  const res = await fetch(`${API_PREFIX}/public/restaurant/`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
