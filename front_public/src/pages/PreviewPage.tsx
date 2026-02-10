import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Star, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhotoGallery } from "@/components/PhotoGallery";
import { ReviewCard } from "@/components/ReviewCard";
import { DishCard } from "@/components/DishCard";
import { useLanguage } from "@/context/LanguageContext";

import { fetchPublicMenu, fetchPublicRestaurant } from "@/api/public";
import { adaptPublicMenuToUi } from "@/api/adapters/menuAdapter";

import { uiTranslations, reviews } from "@/data/menuData";
import { restaurantPhotos, dishImages } from "@/data/images";
import { resolveLogoUrl } from "@/utils/resolveLogoUrl";


type Lang = "en" | "ru" | "tr";

type UiDish = {
  id: string;
  category: string;
  isVegan: boolean;
  isSpicy: boolean;
  image: string;
  translations: Record<Lang, { name: string; description: string; category: string }>;
  price: number;
};

function ensureDishShape(input: any, fallbackCategory: string): UiDish {
  const id = String(input?.id ?? input?.uuid ?? input?.slug ?? "");
  const category = String(input?.category ?? fallbackCategory ?? "Other");

  const name = String(input?.translations?.en?.name ?? input?.name ?? input?.title ?? "Без названия");
  const description = String(input?.translations?.en?.description ?? input?.description ?? "");

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
    typeof rawPrice === "number" ? rawPrice : typeof rawPrice === "string" ? Number(rawPrice.replace(",", ".")) : 0;

  const price = Number.isFinite(priceNumber) ? priceNumber : 0;

  const translations: UiDish["translations"] = input?.translations?.en
    ? {
        en: {
          name: String(input.translations.en.name ?? name),
          description: String(input.translations.en.description ?? description),
          category: String(input.translations.en.category ?? category),
        },
        ru: {
          name: String(input.translations.ru?.name ?? name),
          description: String(input.translations.ru?.description ?? description),
          category: String(input.translations.ru?.category ?? category),
        },
        tr: {
          name: String(input.translations.tr?.name ?? name),
          description: String(input.translations.tr?.description ?? description),
          category: String(input.translations.tr?.category ?? category),
        },
      }
    : {
        en: { name, description, category },
        ru: { name, description, category },
        tr: { name, description, category },
      };

  return { id, category, isVegan, isSpicy, image, translations, price };
}

export default function PreviewPage() {
  const { language } = useLanguage();
  const lang = (language as Lang) ?? "en";
  const ui = uiTranslations[language];

  const restaurantQuery = useQuery({
    queryKey: ["public-restaurant"],
    queryFn: fetchPublicRestaurant,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const menuQuery = useQuery({
    queryKey: ["public-menu"],
    queryFn: fetchPublicMenu,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

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
        image: dishImages[dish.id] || dish.image || "",
      }))
      .filter((dish) => dish.id);

    return dishes.slice(0, 3);
  }, [menuQuery.data]);

  if (restaurantQuery.isLoading || menuQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (restaurantQuery.isError || menuQuery.isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Не удалось загрузить данные</p>
      </div>
    );
  }

  const restaurantFromApi = restaurantQuery.data as any;

  const restaurantName = String(restaurantFromApi?.name ?? "Restaurant");
  const restaurantDescription = String(restaurantFromApi?.description ?? "");
  const restaurantAddress = String(restaurantFromApi?.address ?? "");
  const restaurantHours = String(restaurantFromApi?.hours ?? "");

  // --- Restaurant logo (только в инфоблоке ресторана) ---
  const restaurantLogoRaw = String(restaurantFromApi?.logo ?? "");

  let restaurantLogoUrl = "";
  if (restaurantLogoRaw) {
    // Абсолютный URL
    if (
      restaurantLogoRaw.startsWith("http://") ||
      restaurantLogoRaw.startsWith("https://")
    ) {
      restaurantLogoUrl = restaurantLogoRaw;
    } else {
      // Приводим к виду с /
      const path = restaurantLogoRaw.startsWith("/")
        ? restaurantLogoRaw
        : `/${restaurantLogoRaw}`;
  
      // Media с бэка (Django)
      if (path.startsWith("/media/")) {
        restaurantLogoUrl = `http://localhost:8000${path}`;
      } else {
        // Статика фронта (/platform/...)
        restaurantLogoUrl = path;
      }
    }
  }
  const FALLBACK_LOGO = "/platform/Turlogo.png"; // 👈 ВОТ СЮДА


  // --- Contacts: backward compatible ---
  // 1) сначала берём новые поля (которые мы добавим на бэке)
  const phoneFromApi = String(restaurantFromApi?.phone ?? "").trim();
  const emailFromApi = String(restaurantFromApi?.email ?? "").trim();
  const addressFromApi = String(restaurantFromApi?.address ?? "").trim(); // у тебя уже есть, оставим

  // 2) если новых нет — парсим legacy contacts
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
  const address = addressFromApi || restaurantAddress; // если позже разделим address отдельно — будет работать

  // --- Platform header (фиксировано, без turqr) ---
  const platformName = "TurQR"; // поменяй на Turka/что хочешь
  const platformLogo = "/platform/Turlogo.png"; // public/platform/Turlogo.png

  return (
    <div className="min-h-screen bg-background">
      {/* Header = ПЛАТФОРМА */}
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
          <PhotoGallery photos={restaurantPhotos} />
        </section>

        {/* Restaurant Info */}
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
            <span className="text-sm">4.8 (127 {ui.reviews.toLowerCase()})</span>
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
                  {ui.openNow}
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

        {/* Reviews (demo) */}
        <section className="mt-8">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">{ui.reviews}</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>

        {/* Featured Dishes */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold text-foreground">{ui.featuredDishes}</h3>
            <Link to="/menu" className="flex items-center gap-1 text-primary text-sm font-medium hover:underline">
              {ui.fullMenu}
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
          <Link to="/menu" className="block w-full py-4 rounded-xl btn-primary text-center font-semibold text-lg">
            {ui.viewMenu}
          </Link>
        </div>
      </div>
    </div>
  );
}
