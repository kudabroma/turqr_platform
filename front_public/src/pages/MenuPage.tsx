import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/NotFound";
import { fetchPublicMenu, fetchPublicRestaurant } from "@/api/public";
import { adaptPublicMenuToUi } from "@/api/adapters/menuAdapter";
import { useSelection } from "@/hooks/useSelection";
import { SelectionBar } from "@/components/SelectionBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchBar } from "@/components/SearchBar";
import { CategoryTabs } from "@/components/CategoryTabs";
import { DishCard } from "@/components/DishCard";
import { DishDetailsModal } from "@/components/DishDetailsModal";

import { restaurantInfo, uiTranslations, type MenuItem } from "@/data/menuData";
import { dishImages } from "@/data/images";
import type { Lang } from "@/api/public";
import { getPublicSlugFromLocation } from "@/utils/publicSlug";

type UiDish = MenuItem & {
  ingredients?: string;
  categoryId?: number | null;
  name_tr?: string;
};

type CategoryOption = {
  id: number | null;
  label: string;
};

function normalizeLang(x: string | null): Lang {
  const v = (x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ru")) return "ru";
  return "tr";
}

function ensureDishShape(
  input: any,
  fallbackCategory: string,
  fallbackCategoryId?: number | null
): UiDish {
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
  const isVegetarian = Boolean(input?.isVegetarian ?? input?.is_vegetarian ?? false);
  const isSpicy = Boolean(input?.isSpicy ?? input?.is_spicy ?? false);
  const isGlutenFree = Boolean(input?.isGlutenFree ?? input?.is_gluten_free ?? false);

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

  const ingredients = String(
    input?.ingredients ??
      input?.composition ??
      input?.details ??
      input?.contents ??
      ""
  ).trim();

  const categoryIdRaw =
    input?.categoryId ??
    input?.category_id ??
    input?.category?.id ??
    fallbackCategoryId;

  const categoryId =
    typeof categoryIdRaw === "number"
      ? categoryIdRaw
      : typeof categoryIdRaw === "string" && categoryIdRaw.trim() !== ""
      ? Number(categoryIdRaw)
      : null;

  const localizedName = String(input?.name ?? name);
  const localizedDescription = String(input?.description ?? description);

  // Сохраняем name_tr для QR официанта (будущая фича)
  const name_tr = String(input?.name_tr ?? localizedName);

  const translations: UiDish["translations"] = {
    en: { name: localizedName, description: localizedDescription, category },
    tr: { name: localizedName, description: localizedDescription, category },
    ru: { name: localizedName, description: localizedDescription, category },
  };

  return {
    id,
    category,
    categoryId: Number.isFinite(categoryId as number) ? categoryId : null,
    price,
    image,
    isVegan,
    isVegetarian,
    isSpicy,
    isGlutenFree,
    translations,
    ingredients: ingredients || undefined,
    name_tr,
  };
}

export default function MenuPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const [searchParams] = useSearchParams();
  const lang = normalizeLang(searchParams.get("lang"));
  const slug = getPublicSlugFromLocation();

  const restaurantDemo = (restaurantInfo as any)?.translations?.[lang];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ui = (uiTranslations as any)?.[lang];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [selectedDish, setSelectedDish] = useState<UiDish | null>(null);
  const [dishOpen, setDishOpen] = useState(false);

  // ✅ Корзина
  const { selected, add, remove, clear, total, count } = useSelection();

  const menuQuery = useQuery({
    queryKey: ["public-menu", slug, lang],
    queryFn: () => fetchPublicMenu(slug, lang),
    enabled: !!slug,
    staleTime: 0,
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
      const catIdRaw = cat?.id;
      const catId =
        typeof catIdRaw === "number"
          ? catIdRaw
          : typeof catIdRaw === "string" && catIdRaw.trim() !== ""
          ? Number(catIdRaw)
          : null;

      const arr = Array.isArray(cat?.dishes) ? cat.dishes : [];
      arr.forEach((d: any) =>
        dishesRaw.push({
          ...d,
          category: catName,
          categoryId:
            d?.categoryId ?? d?.category_id ?? d?.category?.id ?? catId ?? null,
        })
      );
    });

    return dishesRaw
      .filter((d) => d && typeof d === "object")
      .map((d) =>
        ensureDishShape(
          d,
          String(d?.category ?? "Other"),
          d?.categoryId ?? d?.category_id ?? null
        )
      )
      .map((dish) => ({ ...dish, image: dishImages[dish.id] || dish.image || "" }))
      .filter((dish) => dish.id);
  }, [menuQuery.data]);

  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const map = new Map<number, string>();

    enhancedMenuItems.forEach((d) => {
      const id = d.categoryId;
      const label = d.translations?.[lang]?.category || d.category;

      if (id != null && label && !map.has(id)) {
        map.set(id, label);
      }
    });

    return [
      {
        id: null,
        label: lang === "en" ? "All" : lang === "ru" ? "Все" : "Tümü",
      },
      ...Array.from(map.entries()).map(([id, label]) => ({
        id,
        label,
      })),
    ];
  }, [enhancedMenuItems, lang]);

  const filteredItems = useMemo(() => {
    return enhancedMenuItems.filter((dish) => {
      if (activeCategoryId !== null && dish.categoryId !== activeCategoryId) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const t = dish.translations[lang];
        const name = (t?.name ?? "").toLowerCase();
        const desc = (t?.description ?? "").toLowerCase();

        if (!name.includes(query) && !desc.includes(query)) return false;
      }

      return true;
    });
  }, [enhancedMenuItems, lang, activeCategoryId, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: UiDish[] } = {};

    filteredItems.forEach((dish) => {
      const categoryName =
        dish.translations[lang]?.category ?? dish.category ?? "Other";

      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(dish);
    });

    return groups;
  }, [filteredItems, lang]);

  const loadingText =
    lang === "en"
      ? "Loading menu..."
      : lang === "ru"
      ? "Загрузка меню..."
      : "Menü yükleniyor...";

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
    return <NotFound />;
  }

  const restaurantName =
    restaurantFromApi?.name ?? restaurantDemo?.name ?? "Restaurant";

  // ✅ Добавление в корзину — передаём локализованное имя + name_tr для официанта
  function handleAddToSelection(dish: UiDish) {
    add({
      id: dish.id,
      name: dish.translations[lang]?.name ?? dish.id,
      name_tr: dish.name_tr ?? dish.translations.tr?.name ?? dish.id,
      price: dish.price,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to={`/?slug=${encodeURIComponent(slug)}&lang=${lang}`}
                className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
              >
                <Home className="w-5 h-5" />
              </Link>

              <h1 className="font-sans font-semibold text-lg text-foreground truncate">
                {restaurantName}
              </h1>
            </div>

            <LanguageSwitcher />
          </div>

          <div className="mt-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={
                lang === "tr"
                  ? "Yemek ara..."
                  : lang === "ru"
                  ? "Поиск блюд..."
                  : "Search dishes..."
              }
            />
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <CategoryTabs
              activeCategoryId={activeCategoryId}
              onCategoryChange={setActiveCategoryId}
              categories={categoryOptions}
              lang={lang}
            />
          </div>
        </div>
      </header>

      {/* pb-32 — отступ чтобы корзина не перекрывала последнее блюдо */}
      <main className="container max-w-lg mx-auto px-4 pt-5 pb-24">
        {activeCategoryId === null ? (
          Object.entries(groupedItems).map(([categoryName, dishes]) => (
            <section key={categoryName} className="mb-8">
              <h2 className="font-sans text-[20px] font-semibold text-foreground mb-3">
                {categoryName}
              </h2>

              <div className="flex flex-col">
                {dishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    variant="full"
                    onAdd={() => handleAddToSelection(dish)}
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
          <div className="flex flex-col">
            {filteredItems.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                variant="full"
                onAdd={() => handleAddToSelection(dish)}
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
              {lang === "en"
                ? "No dishes found"
                : lang === "ru"
                ? "Блюда не найдены"
                : "Yemek bulunamadı"}
            </p>
          </div>
        )}
      </main>

      <DishDetailsModal
        open={dishOpen}
        onOpenChange={(v) => {
          setDishOpen(v);
          if (!v) setSelectedDish(null);
        }}
        dish={selectedDish}
        lang={lang}
      />

      {/* ✅ Корзина — появляется автоматически когда есть выбранные блюда */}
      <SelectionBar
        selected={selected}
        count={count}
        total={total}
        onRemove={remove}
        onClear={clear}
        lang={lang}
      />
    </div>
  );
}