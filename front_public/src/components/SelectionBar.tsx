import { useState } from "react";
import type { SelectedDish } from "@/hooks/useSelection";
import type { Lang } from "@/api/public";

const labels = {
  en: { title: "Your order", clear: "Clear", items: "dishes selected", total: "Total" },
  tr: { title: "Siparişiniz", clear: "Temizle", items: "yemek seçildi", total: "Toplam" },
  ru: { title: "Ваш заказ", clear: "Очистить", items: "блюд выбрано", total: "Итого" },
};

export function SelectionBar({
  selected, count, total, onRemove, onAdd, onClear, lang,
}: {
  selected: SelectedDish[];
  count: number;
  total: number;
  onRemove: (id: string) => void;
  onAdd: (dish: SelectedDish) => void;
  onClear: () => void;
  lang: Lang;
}) {
  const [open, setOpen] = useState(false);
  const t = labels[lang];

  if (count === 0) return null;

  return (
    <>
      {/* Плавающая панель */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm bg-primary text-white px-5 py-4 rounded-2xl shadow-xl cursor-pointer flex items-center justify-between transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setOpen(true)}
        >
          <span className="font-semibold text-base">{count} {t.items}</span>
          <span className="font-bold text-base">{total} ₺</span>
        </div>
      </div>

      {/* Модалка */}
      {open && (
        <>
          {/* Фон — клик закрывает */}
          <div
            className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />

          {/* Контент */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
            <div
              className="w-full bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t.title}</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-border transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* ✅ Список блюд — редизайн: название полное сверху, степпер снизу */}
              <div className="space-y-1 mb-4">
                {selected.map(dish => (
                  <div key={dish.id} className="py-4 border-b border-border last:border-0">
                    {/* Название полное — не обрезается */}
                    <p className="font-semibold text-lg leading-tight mb-3">{dish.name}</p>

                    {/* Цена × кол + степпер */}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        {dish.price} ₺ × {dish.quantity}
                      </span>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-primary">
                          {dish.price * dish.quantity} ₺
                        </span>

                        {/* ✅ Степпер: нейтральный минус, акцентный плюс */}
                        <div className="flex items-center gap-2 bg-muted rounded-2xl px-2 py-1">
                          <button
                            onClick={() => onRemove(dish.id)}
                            className="w-10 h-10 rounded-xl bg-background text-foreground flex items-center justify-center text-2xl font-bold hover:bg-border transition-colors shadow-sm"
                          >
                            −
                          </button>
                          <span className="text-2xl font-bold min-w-[28px] text-center select-none">
                            {dish.quantity}
                          </span>
                          <button
                            onClick={() => onAdd(dish)}
                            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-2xl font-bold hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ Итого — крупнее, с разделителем, акцентная сумма */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-border mb-5">
                <span className="text-xl font-bold">{t.total}</span>
                <span className="text-2xl font-bold text-primary">{total} ₺</span>
              </div>

              {/* Кнопка очистить */}
              <button
                onClick={() => { onClear(); setOpen(false); }}
                className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-base"
              >
                {t.clear}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}