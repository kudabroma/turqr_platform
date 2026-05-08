import { useState } from "react";
import { MenuItem, uiTranslations } from "@/data/menuData";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/api/public";

interface DishCardProps {
  dish: MenuItem & { categoryId?: number | null; ingredients?: string };
  variant?: "full" | "compact";
  onClick?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  quantity?: number;
}

function pickTranslation<T extends Record<string, any>>(
  translations: Partial<Record<"en" | "tr" | "ru", T>> | undefined,
  lang: "en" | "tr" | "ru"
): T {
  if (!translations) return {} as T;
  return (
    translations[lang] ??
    translations.en ??
    translations.tr ??
    (Object.values(translations).find(Boolean) as T) ??
    ({} as T)
  );
}

export function DishCard({ dish, variant = "full", onClick, onAdd, onRemove, quantity = 0 }: DishCardProps) {
  const { language } = useLanguage();
  const lang: Lang = language === "en" ? "en" : language === "ru" ? "ru" : "tr";
  const [popped, setPopped] = useState(false);

  const t = pickTranslation(dish.translations as any, lang);
  const ui = pickTranslation(uiTranslations as any, lang);

  const interactiveProps = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" || e.key === " ") onClick();
        },
      }
    : {};

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onAdd) return;
    onAdd();
    setPopped(true);
    setTimeout(() => setPopped(false), 200);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onRemove?.();
  }

  // Стeppер — показывается когда quantity > 0
  const stepper = onAdd ? (
    quantity > 0 ? (
      <div
        className="flex items-center gap-1 bg-primary rounded-full px-1 py-1 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleRemove}
          className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg font-bold hover:bg-white/30 transition-colors"
        >
          −
        </button>
        <span className="text-white font-bold text-base min-w-[20px] text-center">
          {quantity}
        </span>
        <button
          type="button"
          onClick={handleAdd}
          className={`w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-lg font-bold hover:bg-white/30 transition-all duration-150 ${
            popped ? "scale-125" : ""
          }`}
        >
          +
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={handleAdd}
        className={`w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold transition-all duration-150 ${
          popped ? "scale-125 bg-primary/80" : "hover:scale-110 hover:bg-primary/90"
        }`}
      >
        +
      </button>
    )
  ) : null;

  if (variant === "compact") {
    return (
      <div
        className={`flex gap-3 py-3 ${onClick ? "cursor-pointer" : ""}`}
        {...interactiveProps}
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-muted">
          {dish.image ? (
            <img src={dish.image} alt={t.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-sans font-semibold text-foreground truncate">{t.name}</h4>
            <span className="whitespace-nowrap font-semibold text-primary">
              {dish.price}{ui.currency}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 overflow-hidden text-ellipsis">
            {t.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`py-5 border-b border-border ${onClick ? "cursor-pointer" : ""}`}
      {...interactiveProps}
    >
      <div className="flex items-stretch gap-4">
        <div className="w-36 h-36 rounded-3xl overflow-hidden flex-shrink-0 bg-muted">
          {dish.image ? (
            <img src={dish.image} alt={t.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <h3 className="font-sans text-[20px] leading-tight font-semibold text-foreground">
            {t.name}
          </h3>

          <p className="mt-3 text-base leading-6 text-muted-foreground line-clamp-2">
            {t.description}
          </p>

          {(dish.isVegan || dish.isVegetarian || dish.isSpicy || dish.isGlutenFree) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {dish.isVegan && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  🌱
                </span>
              )}
              {dish.isVegetarian && !dish.isVegan && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-2.5 py-1 text-xs font-medium text-lime-700">
                  🥗
                </span>
              )}
              {dish.isSpicy && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  🌶️
                </span>
              )}
              {dish.isGlutenFree && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  🌾
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-[18px] font-semibold text-primary">
              {dish.price} {ui.currency}
            </span>
            {stepper}
          </div>
        </div>
      </div>
    </div>
  );
}