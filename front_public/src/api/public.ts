const API_PREFIX = "/api";

export type Lang = "en" | "ru" | "tr";

function withLang(url: string, lang?: Lang) {
  if (!lang) return url;
  const encoded = encodeURIComponent(lang);
  return `${url}?lang=${encoded}`;
}

export async function fetchPublicMenu(lang?: Lang) {
  const url = withLang(`${API_PREFIX}/public/menu/`, lang);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchPublicRestaurant(lang?: Lang) {
  const url = withLang(`${API_PREFIX}/public/restaurant/`, lang);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}