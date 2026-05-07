import { useState } from "react";
import type { SelectedDish } from "@/hooks/useSelection";
import type { Lang } from "@/api/public";

const labels = {
  en: { title: "Your order", clear: "Clear", show: "Show to waiter", items: "dishes selected" },
  tr: { title: "Siparişiniz", clear: "Temizle", show: "Garsona göster", items: "yemek seçildi" },
  ru: { title: "Ваш заказ", clear: "Очистить", show: "Показать официанту", items: "блюд выбрано" },
};

export function SelectionBar({
  selected, count, total, onRemove, onClear, lang,
}: {
  selected: SelectedDish[];
  count: number;
  total: number;
  onRemove: (id: string) => void;
  onClear: () => void;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const t = labels[lang];

  if (count === 0) return null;

  return (
    <>
      {/* Панель внизу */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-white px-4 py-3 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="container max-w-lg mx-auto flex items-center justify-between">
          <span className="font-semibold">{count} {t.items}</span>
          <span className="font-bold">{total} ₺</span>
        </div>
      </div>

      {/* Модалка со списком */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t.title}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground text-2xl">✕</button>
            </div>

            <div className="space-y-3 mb-6">
              {selected.map(dish => (
                <div key={dish.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{dish.name}</p>
                    <p className="text-sm text-muted-foreground">{dish.price} ₺ × {dish.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{dish.price * dish.quantity} ₺</span>
                    <button
                      onClick={() => onRemove(dish.id)}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-lg font-bold mb-6">
              <span>Итого</span>
              <span>{total} ₺</span>
            </div>

            <button
              onClick={onClear}
              className="w-full py-3 rounded-xl border border-border text-muted-foreground mb-3"
            >
              {t.clear}
            </button>

            <button
              onClick={() => setOpen(false)}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg"
            >
              {t.show} 👋
            </button>
          </div>
        </div>
      )}
    </>
  );
}