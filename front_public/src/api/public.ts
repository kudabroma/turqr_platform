const API_PREFIX = "/api";

export type Lang = "en" | "tr";

function buildUrl(path: string, slug?: string | null, lang?: Lang) {
  const params = new URLSearchParams();

  // ✅ slug добавляем только если он реально есть
  if (slug) params.set("slug", slug);

  if (lang) params.set("lang", lang);

  const qs = params.toString();
  return `${API_PREFIX}${path}${qs ? `?${qs}` : ""}`;
}

async function getJson(url: string) {
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}${text ? ` | ${text}` : ""}`);
  }

  return res.json();
}

// ✅ slug теперь опциональный: можно и с query slug, и с субдоменом (middleware)
export async function fetchPublicMenu(slug?: string | null, lang?: Lang) {
  const url = buildUrl("/public/menu/", slug, lang);
  return getJson(url);
}

export async function fetchPublicRestaurant(slug?: string | null, lang?: Lang) {
  const url = buildUrl("/public/restaurant/", slug, lang);
  return getJson(url);
}