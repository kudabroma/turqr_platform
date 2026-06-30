import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Clock, Star, ChevronRight, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/NotFound";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReviewCard } from "@/components/ReviewCard";
import { DishCard } from "@/components/DishCard";

import { fetchPublicMenu, fetchPublicRestaurant } from "@/api/public";
import { adaptPublicMenuToUi } from "@/api/adapters/menuAdapter";

import { uiTranslations, getRestaurantMeta } from "@/data/menuData";
import { restaurantPhotos, dishImages } from "@/data/images";
import type { Lang } from "@/api/public";
import { getPublicSlugFromLocation } from "@/utils/publicSlug";

type UiDish = {
  id: string;
  category: string;
  isVegan: boolean;
  isSpicy: boolean;
  image: string;
    translations: Record<"en" | "tr" | "ru", { name: string; description: string; category: string }>;
  price: number;
};

function normalizeLang(x: unknown): Lang {
  const v = String(x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ru")) return "ru";
  return "tr";
}

function parseTimeToMinutes(value: string): number | null {
  const normalized = value.trim().replace(".", ":");
  const match = /^(\d{1,2}):(\d{2})$/.exec(normalized);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isRestaurantOpenNow(workingHours?: string | null): boolean {
  if (!workingHours) return false;
  const normalized = workingHours.trim().replace(/\s+/g, "").replace(/\./g, ":");
  const parts = normalized.split("-");
  if (parts.length !== 2) return false;
  const openMinutes = parseTimeToMinutes(parts[0]);
  const closeMinutes = parseTimeToMinutes(parts[1]);
  if (openMinutes === null || closeMinutes === null) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (openMinutes < closeMinutes) return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  if (openMinutes > closeMinutes) return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  return false;
}

function ensureDishShape(input: any, fallbackCategory: string): UiDish {
  const id = String(input?.id ?? input?.uuid ?? input?.slug ?? "");
  const category = String(input?.category ?? fallbackCategory ?? "Other");
  const name = String(input?.translations?.en?.name ?? input?.name ?? input?.title ?? "Untitled");
  const description = String(input?.translations?.en?.description ?? input?.description ?? "");
  const image =
    typeof input?.image_url === "string" ? input.image_url :
    typeof input?.image === "string" ? input.image :
    typeof input?.photo_url === "string" ? input.photo_url :
    typeof input?.photo === "string" ? input.photo :
    typeof input?.imageUrl === "string" ? input.imageUrl : "";
  const isVegan = Boolean(input?.isVegan ?? input?.is_vegan ?? false);
  const isSpicy = Boolean(input?.isSpicy ?? input?.is_spicy ?? false);
  const rawPrice = input?.price ?? input?.cost ?? input?.price_value ?? input?.amount ?? input?.price_try ?? input?.price_amount;
  const priceNumber = typeof rawPrice === "number" ? rawPrice : typeof rawPrice === "string" ? Number(rawPrice.replace(",", ".")) : 0;
  const price = Number.isFinite(priceNumber) ? priceNumber : 0;
  const translations: UiDish["translations"] = input?.translations ? {
    en: { name: String(input.translations.en?.name ?? name), description: String(input.translations.en?.description ?? description), category: String(input.translations.en?.category ?? category) },
    tr: { name: String(input.translations.tr?.name ?? name), description: String(input.translations.tr?.description ?? description), category: String(input.translations.tr?.category ?? category) },
    ru: { name: String(input.translations.ru?.name ?? name), description: String(input.translations.ru?.description ?? description), category: String(input.translations.ru?.category ?? category) },
  } : {
    en: { name, description, category },
    tr: { name, description, category },
    ru: { name, description, category },
  };
  return { id, category, isVegan, isSpicy, image, translations, price };
}

function normalizePublicImageUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const s = raw.trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${window.location.origin}${s}`;
  return `${window.location.origin}/${s}`;
}

export default function PreviewPage() {
  const [searchParams] = useSearchParams();
  const lang = normalizeLang(searchParams.get("lang"));
  const slug = getPublicSlugFromLocation();

  const ui = (uiTranslations as any)?.[lang];
  const menuLink = `/menu?slug=${encodeURIComponent(slug)}&lang=${lang}`;

  // Получаем мета данные ресторана (рейтинг + отзывы) по slug
  const restaurantMeta = useMemo(() => getRestaurantMeta(slug), [slug]);

  const restaurantQuery = useQuery({
    queryKey: ["public-restaurant", slug, lang],
    queryFn: () => fetchPublicRestaurant(slug, lang),
    enabled: !!slug,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const menuQuery = useQuery({
    queryKey: ["public-menu", slug, lang],
    queryFn: () => fetchPublicMenu(slug, lang),
    enabled: !!slug,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const restaurantFromApi = restaurantQuery.data as any;
  const enabledLanguages: string[] = restaurantFromApi?.enabled_languages ?? ["tr", "ru", "en"];

  const galleryPhotos: string[] = useMemo(() => {
    const r: any = restaurantFromApi;
    if (!r) return restaurantPhotos;
    const arr = [1, 2, 3, 4, 5, 6]
      .map((i) => {
        const url = normalizePublicImageUrl(r?.[`photo${i}_url`]);
        const raw = normalizePublicImageUrl(r?.[`photo${i}`]);
        return url || raw || "";
      })
      .filter(Boolean) as string[];
    return arr.length ? arr : restaurantPhotos;
  }, [restaurantFromApi]);

  const featuredDishes: UiDish[] = useMemo(() => {
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
      .map((dish) => ({ ...dish, image: dish.image || dishImages[dish.id] || "" }))
      .filter((dish) => dish.id)
      .slice(0, 3);
  }, [menuQuery.data]);

  if (!slug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          {lang === "en" ? "Missing restaurant slug in URL (?slug=...)" : "URL'de restoran slug yok (?slug=...)"}
        </p>
      </div>
    );
  }

  if (restaurantQuery.isLoading || menuQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          {lang === "en" ? "Loading..." : lang === "ru" ? "Загрузка..." : "Yükleniyor..."}
        </p>
      </div>
    );
  }

  if (restaurantQuery.isError || menuQuery.isError) {
    return <NotFound />;
  }

  const restaurantName = String(restaurantFromApi?.name ?? "Restaurant");
  const restaurantDescription = String(
    lang === "ru"
      ? (restaurantFromApi?.description_ru || restaurantFromApi?.description_tr || restaurantFromApi?.description || "")
      : lang === "en"
      ? (restaurantFromApi?.description_en || restaurantFromApi?.description_tr || restaurantFromApi?.description || "")
      : (restaurantFromApi?.description_tr || restaurantFromApi?.description || "")
  );
  const restaurantWorkingHours = String(restaurantFromApi?.working_hours ?? restaurantFromApi?.hours ?? "").trim();
  const isOpenNow = isRestaurantOpenNow(restaurantWorkingHours);
  const phone = String(restaurantFromApi?.phone ?? "").trim();
  const email = String(restaurantFromApi?.email ?? "").trim();
  const address = String(restaurantFromApi?.address ?? "").trim();
  const contactsRaw = String(restaurantFromApi?.contacts ?? "");
  const contactsLines = contactsRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const otherContactsParsed = contactsLines.filter((x) => x !== phone && x !== email && x !== address);

  const platformLogo = "/platform/Turlogo.png";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={platformLogo}
              alt="TurQR"
              className="w-auto h-10 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <LanguageSwitcher enabledLanguages={enabledLanguages} />
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pb-24">
        <section className="mt-4">
          <PhotoGallery photos={galleryPhotos} />
        </section>

        <section className="mt-6 animate-fade-in">
          <div className="mb-2">
            <h2 className="font-sans text-2xl font-bold text-foreground">{restaurantName}</h2>
          </div>

          {/* Рейтинг — уникальный для каждого ресторана */}
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-sm">
              {restaurantMeta.rating} ({restaurantMeta.reviewCount} {String(ui?.reviews ?? "Reviews").toLowerCase()})
            </span>
          </div>

          {restaurantDescription && (
            <p className="mb-4 mt-6 text-[15px] leading-7 text-muted-foreground max-w-prose whitespace-pre-line">
              {restaurantDescription}
            </p>
          )}

          <div className="mt-6 space-y-4">
            {address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-foreground text-sm leading-6">{address}</div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-foreground text-sm">{restaurantWorkingHours || "-"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isOpenNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {isOpenNow
                    ? (lang === "en" ? "Open" : lang === "ru" ? "Открыто" : "Açık")
                    : (lang === "en" ? "Closed" : lang === "ru" ? "Закрыто" : "Kapalı")}
                </span>
              </div>
            </div>

            {(phone || email || otherContactsParsed.length > 0) && (
              <div className="space-y-3 text-sm text-foreground">
                {phone && (
                  <div className="flex items-start gap-3">
                    <span className="w-5 shrink-0 text-primary">📞</span>
                    <span className="leading-6">{phone}</span>
                  </div>
                )}
                {email && (
                  <div className="flex items-start gap-3">
                    <span className="w-5 shrink-0 text-primary">✉️</span>
                    <span className="leading-6">{email}</span>
                  </div>
                )}
                {otherContactsParsed.filter((x) => x !== address).map((x) => (
                  <div key={x} className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="leading-6">{x}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Отзывы — уникальные для каждого ресторана */}
        <section className="mt-8">
          <h3 className="font-sans text-xl font-semibold text-foreground mb-4 mt-8">
            {ui?.reviews ?? (lang === "en" ? "Reviews" : "Yorumlar")}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {restaurantMeta.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4 mt-8">
            <h3 className="font-sans text-xl font-semibold text-foreground">
              {ui?.featuredDishes ?? (lang === "en" ? "Featured Dishes" : "Öne Çıkanlar")}
            </h3>
            <Link to={menuLink} className="flex items-center gap-1 text-primary text-sm font-medium hover:underline">
              {ui?.fullMenu ?? (lang === "en" ? "Full Menu" : "Tam Menü")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {featuredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} variant="compact" />
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="container max-w-lg mx-auto">
          <Link to={menuLink} className="block w-full py-4 rounded-xl btn-primary text-center font-semibold text-lg">
            {ui?.viewMenu ?? (lang === "en" ? "View Menu" : "Menüyü Görüntüle")}
          </Link>
        </div>
      </div>
    </div>
  );
}