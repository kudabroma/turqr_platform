type UnknownRecord = Record<string, unknown>;

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumberLike(v: unknown, fallback = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export type UiDish = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  // ✅ пробрасываем все поля из API
  [key: string]: unknown;
};

export type UiCategory = {
  id: string;
  name: string;
  dishes: UiDish[];
};

export function adaptPublicMenuToUi(apiData: unknown): UiCategory[] {
  const root = apiData as unknown;

  const categoriesRaw: unknown =
    Array.isArray(root)
      ? root
      : (root as UnknownRecord)?.categories ??
        (root as UnknownRecord)?.results ??
        (root as UnknownRecord)?.data ??
        [];

  if (!Array.isArray(categoriesRaw)) return [];

  return categoriesRaw.map((cat, catIndex) => {
    const c = (cat ?? {}) as UnknownRecord;

    const dishesRaw: unknown = c.dishes ?? c.items ?? c.menu_items ?? [];
    const dishesArr = Array.isArray(dishesRaw) ? dishesRaw : [];

    const dishes: UiDish[] = dishesArr.map((dish, dishIndex) => {
      const d = (dish ?? {}) as UnknownRecord;

      const id =
        asString(d.id) ||
        asString(d.uuid) ||
        asString(d.slug) ||
        `${catIndex}-${dishIndex}`;

      const name = asString(d.name) || asString(d.title) || "Без названия";
      const description = asString(d.description) || "";

      const price =
        asNumberLike(d.price, NaN) ||
        asNumberLike(d.cost, NaN) ||
        asNumberLike(d.price_value, NaN) ||
        0;

      const imageUrl =
        asString(d.image) ||
        asString(d.image_url) ||
        asString(d.photo) ||
        asString(d.photo_url) ||
        undefined;

      // ✅ FIX: ...d прокидывает is_vegan, is_spicy, is_vegetarian, is_gluten_free и все остальные поля из API
      return { ...d, id, name, description, price, imageUrl };
    });

    const id = asString(c.id) || asString(c.slug) || `${catIndex}`;
    const name = asString(c.name) || asString(c.title) || "Категория";

    return { id, name, dishes };
  });
}