import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { fetchPublicMenu, fetchPublicRestaurant } from "@/api/public";
import { adaptPublicMenuToUi } from "@/api/adapters/menuAdapter";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchBar } from "@/components/SearchBar";
import { CategoryTabs } from "@/components/CategoryTabs";
import { DishCard } from "@/components/DishCard";
import { DishDetailsModal } from "@/components/DishDetailsModal";

import { restaurantInfo, uiTranslations, type MenuItem } from "@/data/menuData";
import { dishImages } from "@/data/images";
import type { Lang } from "@/api/public";
import { getPublicSlugFromLocation } from "@/utils/publicSlug";

// ✅ UiDish делаем совместимым с MenuItem
type UiDish = MenuItem & {
  // ✅ одно поле “из чего сделано / состав”
  ingredients?: string;
};

function normalizeLang(x: string | null): Lang {
  const v = (x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  return "tr";
}

// ✅ делаем объект ровно в форме MenuItem (+ ingredients optional)
function ensureDishShape(input: any, fallbackCategory: string): UiDish {
  const id = String(input?.id ?? input?.uuid ?? input?.slug ?? "");
  const category = String(input?.category ?? fallbackCategory ?? "Other");

  const name = String(
    input?.translations?.en?.name ?? input?.name ?? input?.title ?? "Untitled"
  );
  const description = String(
    input?.translations?.en?.description ?? input?.description ?? ""
  );

  const image =
    typeof input?.image === "string"
      ? input.image
      : typeof input?.image_url === "string"
      ? input.image_url
      : typeof input?.photo === "string"
      ? input.photo
      : typeof input?.photo_url === "string"
      ? input.photo_url
      : typeof input?.imageUrl === "string"
      ? input.imageUrl
      : "";

  const isVegan = Boolean(input?.isVegan ?? input?.is_vegan ?? false);
  const isSpicy = Boolean(input?.isSpicy ?? input?.is_spicy ?? false);

  const rawPrice =
    input?.price ??
    input?.cost ??
    input?.price_value ??
    input?.amount ??
    input?.price_try ??
    input?.price_amount;

  const priceNumber =
    typeof rawPrice === "number"
      ? rawPrice
      : typeof rawPrice === "string"
      ? Number(rawPrice.replace(",", "."))
      : 0;

  const price = Number.isFinite(priceNumber) ? priceNumber : 0;

  // ✅ одно поле “из чего сделано / состав” (если нет в API — будет "")
  const ingredients = String(
    input?.ingredients ??
      input?.composition ??
      input?.details ??
      input?.contents ??
      ""
  ).trim();

  // ✅ translations строго en+tr (public)
  const translations: UiDish["translations"] = input?.translations
    ? {
        en: {
          name: String(input.translations.en?.name ?? name),
          description: String(input.translations.en?.description ?? description),
          category: String(input.translations.en?.category ?? category),
        },
        tr: {
          name: String(input.translations.tr?.name ?? name),
          description: String(input.translations.tr?.description ?? description),
          category: String(input.translations.tr?.category ?? category),
        },
      }
    : {
        en: { name, description, category },
        tr: { name, description, category },
      };

  return {
    id,
    category,
    price,
    image,
    isVegan,
    isSpicy,
    translations,
    ingredients: ingredients || undefined,
  };
}

export default function MenuPage() {
  const [searchParams] = useSearchParams();

  const lang = normalizeLang(searchParams.get("lang"));
  const slug = getPublicSlugFromLocation(); // ✅ query slug OR subdomain slug

  // demo fallback (если вдруг API пустой/нет данных)
  const restaurantDemo = (restaurantInfo as any)?.translations?.[lang];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ui = (uiTranslations as any)?.[lang];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // ✅ модалка деталей блюда
  const [selectedDish, setSelectedDish] = useState<UiDish | null>(null);
  const [dishOpen, setDishOpen] = useState(false);

  const menuQuery = useQuery({
    queryKey: ["public-menu", slug, lang],
    queryFn: () => fetchPublicMenu(slug, lang),
    enabled: !!slug,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const restaurantQuery = useQuery({
    queryKey: ["public-restaurant", slug, lang],
    queryFn: () => fetchPublicRestaurant(slug, lang),
    enabled: !!slug,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const restaurantFromApi = restaurantQuery.data as any;

  const enhancedMenuItems: UiDish[] = useMemo(() => {
    const adaptedCategories = adaptPublicMenuToUi(menuQuery.data);

    const dishesRaw: any[] = [];
    adaptedCategories.forEach((cat: any) => {
      const catName = String(cat?.name ?? "Other");
      const arr = Array.isArray(cat?.dishes) ? cat.dishes : [];
      arr.forEach((d: any) => dishesRaw.push({ ...d, category: catName }));
    });

    return dishesRaw
      .filter((d) => d && typeof d === "object")
      .map((d) => ensureDishShape(d, String(d?.category ?? "Other")))
      .map((dish) => ({ ...dish, image: dishImages[dish.id] || dish.image || "" }))
      .filter((dish) => dish.id);
  }, [menuQuery.data]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    enhancedMenuItems.forEach((d) => {
      const cat = d.translations[lang]?.category || d.category;
      if (cat) set.add(cat);
    });
    return ["all", ...Array.from(set)];
  }, [enhancedMenuItems, lang]);

  const filteredItems = useMemo(() => {
    return enhancedMenuItems.filter((dish) => {
      const t = dish.translations[lang];
      const catForLang = t?.category || dish.category;

      if (activeCategory !== "all" && catForLang !== activeCategory) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (t?.name ?? "").toLowerCase();
        const desc = (t?.description ?? "").toLowerCase();
        if (!name.includes(query) && !desc.includes(query)) return false;
      }

      return true;
    });
  }, [enhancedMenuItems, lang, activeCategory, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: UiDish[] } = {};
    filteredItems.forEach((dish) => {
      const categoryName = dish.translations[lang]?.category ?? dish.category ?? "Other";
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(dish);
    });
    return groups;
  }, [filteredItems, lang]);

  const loadingText = lang === "en" ? "Loading menu..." : "Menü yükleniyor...";
  const errorText = lang === "en" ? "Failed to load data" : "Veri yüklenemedi";

  if (!slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          {lang === "en"
            ? "Missing restaurant slug in URL (?slug=...)"
            : "URL'de restoran slug yok (?slug=...)"}
        </p>
      </div>
    );
  }

  if (menuQuery.isLoading || restaurantQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{loadingText}</p>
      </div>
    );
  }

  if (menuQuery.isError || restaurantQuery.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{errorText}</p>
      </div>
    );
  }

  const restaurantName = restaurantFromApi?.name ?? restaurantDemo?.name ?? "Restaurant";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link
                to={`/?slug=${encodeURIComponent(slug)}&lang=${lang}`}
                className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Home className="w-5 h-5" />
              </Link>

              <h1 className="font-display font-semibold text-lg text-foreground">
                {restaurantName}
              </h1>
            </div>

            <LanguageSwitcher />
          </div>

          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div className="mt-3">
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              categories={categoryOptions}
              lang={lang}
            />
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6">
        {activeCategory === "all" ? (
          Object.entries(groupedItems).map(([categoryName, dishes]) => (
            <section key={categoryName} className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onClick={() => {
                      setSelectedDish(dish);
                      setDishOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                onClick={() => {
                  setSelectedDish(dish);
                  setDishOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {lang === "en" ? "No dishes found" : "Yemek bulunamadı"}
            </p>
          </div>
        )}
      </main>

      {/* ✅ модалка деталей блюда */}
      <DishDetailsModal
        open={dishOpen}
        onOpenChange={(v) => {
          setDishOpen(v);
          if (!v) setSelectedDish(null);
        }}
        dish={selectedDish}
        lang={lang}
      />
    </div>
  );
}