import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
import { getRawLang, normalizeLang } from "@/utils/lang";

type UiDish = MenuItem & {
  ingredients?: string;
  categoryId?: number | null;
  name_tr?: string;
};

type CategoryOption = {
  id: number | null;
  label: string;
};

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
  const navigate = useNavigate();
  const location = useLocation();
  const slug = getPublicSlugFromLocation();

  // Raw lang from URL — used for API query keys before restaurant data is available
  const rawLang = getRawLang(searchParams.get("lang"));

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [selectedDish, setSelectedDish] = useState<UiDish | null>(null);
  const [dishOpen, setDishOpen] = useState(false);

  const { selected, add, remove, clear, total, count, getQuantity } = useSelection();

  const menuQuery = useQuery({
    queryKey: ["public-menu", slug, rawLang],
    queryFn: () => fetchPublicMenu(slug, rawLang),
    enabled: !!slug,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ✅ Отдельный запрос на турецком — для name_tr в корзине
  // Делается только когда язык не турецкий
  const menuQueryTr = useQuery({
    queryKey: ["public-menu", slug, "tr"],
    queryFn: () => fetchPublicMenu(slug, "tr"),
    enabled: !!slug && rawLang !== "tr",
    staleTime: 300_000, // 5 минут — турецкие названия меняются редко
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const restaurantQuery = useQuery({
    queryKey: ["public-restaurant", slug, rawLang],
    queryFn: () => fetchPublicRestaurant(slug, rawLang),
    enabled: !!slug,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Derive enabled languages and effective lang once restaurant data is available
  const restaurantFromApi = restaurantQuery.data as any;
  const enabledLanguages: string[] = restaurantFromApi?.enabled_languages ?? ["tr", "ru", "en"];
  const lang = normalizeLang(searchParams.get("lang"), enabledLanguages);
  const ui = (uiTranslations as Record<string, any>)[lang] ?? uiTranslations.tr;
  const restaurantDemo = (restaurantInfo as any)?.translations?.[lang];

  // Redirect to first enabled lang if URL lang is not in the restaurant's list
  useEffect(() => {
    if (!restaurantFromApi) return;
    const enabled = restaurantFromApi.enabled_languages as string[] | undefined;
    if (!enabled?.length) return;
    if (rawLang && !enabled.includes(rawLang)) {
      const sp = new URLSearchParams(searchParams);
      sp.set("lang", enabled[0]);
      navigate({ pathname: location.pathname, search: `?${sp.toString()}` }, { replace: true });
    }
  }, [restaurantFromApi]);

  // ✅ Map id → name_tr для быстрого поиска турецкого названия
  const trNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (lang === "tr") return map;

    const adaptedTr = adaptPublicMenuToUi(menuQueryTr.data);
    adaptedTr.forEach((cat: any) => {
      (Array.isArray(cat?.dishes) ? cat.dishes : []).forEach((d: any) => {
        if (d?.id) map.set(String(d.id), String(d.name ?? ""));
      });
    });
    return map;
  }, [menuQueryTr.data, lang]);

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
        label: ui?.allCategories ?? "Tümü",
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

  const loadingText = ui?.loadingMenu ?? "Menü yükleniyor...";

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

  // ✅ Добавление в корзину — name_tr берётся из trNameMap
  function handleAddToSelection(dish: UiDish) {
    const dishName =
      dish.translations[lang]?.name ??
      dish.translations.en?.name ??
      dish.translations.tr?.name ??
      dish.name_tr;
    add({
      id: dish.id,
      name: dishName || `Dish ${dish.id}`,
      name_tr: trNameMap.get(dish.id) || dish.name_tr || dishName || `Dish ${dish.id}`,
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

            <LanguageSwitcher enabledLanguages={enabledLanguages} />
          </div>

          <div className="mt-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={ui?.search ?? "Yemek ara..."}
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
                    quantity={getQuantity(dish.id)}
                    onAdd={() => handleAddToSelection(dish)}
                    onRemove={() => remove(dish.id)}
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
                quantity={getQuantity(dish.id)}
                onAdd={() => handleAddToSelection(dish)}
                onRemove={() => remove(dish.id)}
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
              {ui?.noDishesFound ?? "Yemek bulunamadı"}
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
        onAdd={selectedDish ? () => handleAddToSelection(selectedDish) : undefined}
      />

      <SelectionBar
        selected={selected}
        count={count}
        total={total}
        onRemove={remove}
        onAdd={(dish) => add({
          id: dish.id,
          name: dish.name,
          name_tr: dish.name_tr,
          price: dish.price,
        })}
        onClear={clear}
        lang={lang}
      />
    </div>
  );
}