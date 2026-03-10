import { X, Flame, Leaf } from "lucide-react";
import type { Lang } from "@/api/public";
import { uiTranslations } from "@/data/menuData";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type DishTranslations = Record<Lang, { name: string; description: string; category: string }>;

export type UiDishLike = {
  id: string;
  image: string;
  price: number;
  isVegan?: boolean;
  isSpicy?: boolean;
  translations: DishTranslations;
  ingredients?: string;
};

function pickTranslation<T extends Record<string, any>>(translations: T, lang: Lang) {
  return (
    translations[lang] ??
    translations.en ??
    translations.tr ??
    (Object.values(translations).find(Boolean) as any) ??
    {}
  );
}

function normalizeText(x: unknown): string {
  return typeof x === "string" ? x.trim() : "";
}

export function DishDetailsModal({
  open,
  onOpenChange,
  dish,
  lang,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dish: UiDishLike | null;
  lang: Lang;
}) {
  if (!dish) return null;

  const t = pickTranslation(dish.translations as any, lang) as {
    name?: string;
    description?: string;
    category?: string;
  };

  const ui = pickTranslation(uiTranslations as any, lang) as any;

  const description = normalizeText(t?.description);
  const ingredients = normalizeText(dish.ingredients);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[calc(100vw-24px)] max-h-[88vh] p-0 overflow-hidden rounded-3xl flex flex-col">
        {/* TOP: фото + X */}
        <div className="relative bg-background">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-6 pt-8 pb-5">
            <div className="w-full bg-muted rounded-2xl overflow-hidden">
              <div className="h-[260px] sm:h-[300px]">
                {dish.image ? (
                  <img
                    src={dish.image}
                    alt={t?.name ?? "Dish"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="px-6 pb-6 overflow-auto flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-sans text-3xl font-semibold text-foreground leading-tight">
              {t?.name ?? "Dish"}
            </h2>

            <span className="text-2xl font-semibold text-orange-500 leading-none">
              {dish.price}{ui?.currency ?? "₺"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {dish.isVegan && (
              <span className="filter-badge filter-badge-vegan">
                <Leaf className="w-3 h-3" />
                {ui?.vegan ?? "Vegan"}
              </span>
            )}
            {dish.isSpicy && (
              <span className="filter-badge filter-badge-spicy">
                <Flame className="w-3 h-3" />
                {ui?.spicy ?? "Spicy"}
              </span>
            )}
          </div>

          <div className="mt-5 space-y-5">
            {description && (
              <p className="text-base text-muted-foreground whitespace-pre-line leading-8">
                {description}
              </p>
            )}

            {ingredients && (
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {lang === "en" ? "Ingredients" : "İçindekiler"}
                </h4>
                <p className="text-base text-muted-foreground mt-2 whitespace-pre-line leading-8">
                  {ingredients}
                </p>
              </div>
            )}

            {!description && !ingredients && (
              <p className="text-base text-muted-foreground">
                {lang === "en" ? "No details provided." : "Detay bilgisi yok."}
              </p>
            )}
          </div>

          <div className="h-4" />
        </div>
      </DialogContent>
    </Dialog>
  );
}