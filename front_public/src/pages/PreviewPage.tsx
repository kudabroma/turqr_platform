import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Clock, Star, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReviewCard } from "@/components/ReviewCard";
import { DishCard } from "@/components/DishCard";

import { fetchPublicMenu, fetchPublicRestaurant } from "@/api/public";
import { adaptPublicMenuToUi } from "@/api/adapters/menuAdapter";

import { uiTranslations, reviews } from "@/data/menuData";
import { restaurantPhotos, dishImages } from "@/data/images";
import type { Lang } from "@/api/public";
import { getPublicSlugFromLocation } from "@/utils/publicSlug";

type UiDish = {
  id: string;
  category: string;
  isVegan: boolean;
  isSpicy: boolean;
  image: string;
  translations: Record<Lang, { name: string; description: string; category: string }>;
  price: number;
};

function normalizeLang(x: unknown): Lang {
  const v = String(x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  return "tr";
}

function ensureDishShape(input: any, fallbackCategory: string): UiDish {
  const id = String(input?.id ?? input?.uuid ?? input?.slug ?? "");
  const category = String(input?.category ?? fallbackCategory ?? "Other");

  const name = String(input?.translations?.en?.name ?? input?.name ?? input?.title ?? "Untitled");
  const description = String(input?.translations?.en?.description ?? input?.description ?? "");

  const image =
    typeof input?.image_url === "string"
      ? input.image_url
      : typeof input?.image === "string"
      ? input.image
      : typeof input?.photo_url === "string"
      ? input.photo_url
      : typeof input?.photo === "string"
      ? input.photo
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

  // ✅ только public языки en/tr
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
  const slug = getPublicSlugFromLocation(); // ✅ SOURCE OF TRUTH

  const ui = (uiTranslations as any)?.[lang];

  // ✅ важно: menuLink теперь всегда сохраняет slug+lang
  const menuLink = `/menu?slug=${encodeURIComponent(slug)}&lang=${lang}`;

  const restaurantQuery = useQuery({
    queryKey: ["public-restaurant", slug, lang],
    queryFn: () => fetchPublicRestaurant(slug, lang),
    enabled: !!slug, // ✅ guard
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const menuQuery = useQuery({
    queryKey: ["public-menu", slug, lang],
    queryFn: () => fetchPublicMenu(slug, lang),
    enabled: !!slug, // ✅ guard
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const restaurantFromApi = restaurantQuery.data as any;

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

    const dishes = dishesRaw
      .filter((d) => d && typeof d === "object")
      .map((d) => ensureDishShape(d, String(d?.category ?? "Other")))
      .map((dish) => ({
        ...dish,
        image: dish.image || dishImages[dish.id] || "",
      }))
      .filter((dish) => dish.id);

    return dishes.slice(0, 3);
  }, [menuQuery.data]);

  // ✅ если slug не указан — понятный экран, запросы не идут
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

  if (restaurantQuery.isLoading || menuQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{lang === "en" ? "Loading..." : "Yükleniyor..."}</p>
      </div>
    );
  }

  if (restaurantQuery.isError || menuQuery.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">
          {lang === "en" ? "Failed to load data" : "Veri yüklenemedi"}
        </p>
      </div>
    );
  }

  const restaurantName = String(restaurantFromApi?.name ?? "Restaurant");
  const restaurantDescription = String(restaurantFromApi?.description ?? "");
  const restaurantAddress = String(restaurantFromApi?.address ?? "");
  const restaurantHours = String(restaurantFromApi?.hours ?? "");

  const phoneFromApi = String(restaurantFromApi?.phone ?? "").trim();
  const emailFromApi = String(restaurantFromApi?.email ?? "").trim();
  const addressFromApi = String(restaurantFromApi?.address ?? "").trim();

  const contactsRaw = String(restaurantFromApi?.contacts ?? "");
  const contactsLines = contactsRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const emailParsed = contactsLines.find((x) => x.includes("@")) ?? "";
  const phoneParsed = contactsLines.find((x) => /[0-9]{6,}/.test(x)) ?? "";
  const otherContactsParsed = contactsLines.filter((x) => x !== emailParsed && x !== phoneParsed);

  const phone = phoneFromApi || phoneParsed;
  const email = emailFromApi || emailParsed;
  const address = addressFromApi || restaurantAddress;

  const platformName = "TurQR";
  const platformLogo = "/platform/Turlogo.png";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={platformLogo}
              alt={platformName}
              className="w-9 h-9 rounded-xl object-contain bg-card"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-display font-semibold text-lg text-foreground">{platformName}</span>
          </div>

          <LanguageSwitcher />
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pb-24">
        <section className="mt-4">
          <PhotoGallery photos={galleryPhotos} />
        </section>

        <section className="mt-6 animate-fade-in">
          <div className="mb-2">
            <h2 className="font-display text-2xl font-bold text-foreground">{restaurantName}</h2>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-sm">4.8 (127 {String(ui?.reviews ?? "Reviews").toLowerCase()})</span>
          </div>

          {restaurantDescription && <p className="text-muted-foreground mb-4">{restaurantDescription}</p>}

          <div className="space-y-2">
            {(address || phone || email || otherContactsParsed.length > 0) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-foreground text-sm space-y-1">
                  {address && <div>{address}</div>}
                  {!address && phone && <div>📞 {phone}</div>}
                  {!address && email && <div>✉️ {email}</div>}
                  {!address && otherContactsParsed.map((x) => <div key={x}>{x}</div>)}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm">{restaurantHours || "-"}</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                  {ui?.openNow ?? (lang === "en" ? "Open Now" : "Açık")}
                </span>
              </div>
            </div>

            {address && (phone || email || otherContactsParsed.length > 0) && (
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                {phone && <div>📞 {phone}</div>}
                {email && <div>✉️ {email}</div>}
                {otherContactsParsed.map((x) => (
                  <div key={x}>{x}</div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">
            {ui?.reviews ?? (lang === "en" ? "Reviews" : "Yorumlar")}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold text-foreground">
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