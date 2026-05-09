import { useState } from "react";
import type { SelectedDish } from "@/hooks/useSelection";
import type { Lang } from "@/api/public";

const labels = {
  en: { title: "Your order", clear: "Clear order", items: "dishes selected", total: "Total" },
  tr: { title: "Siparişiniz", clear: "Siparişi temizle", items: "yemek seçildi", total: "Toplam" },
  ru: { title: "Ваш заказ", clear: "Очистить заказ", items: "блюд выбрано", total: "Итого" },
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

  // Показываем name_tr только если язык не турецкий
  const showTrName = lang !== "tr";

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
              className="w-full bg-background rounded-t-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок с drag-handle */}
              <div className="flex flex-col items-center pt-3 pb-2 px-6">
                <div className="w-10 h-1 rounded-full bg-border mb-4" />
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h2 className="text-2xl font-bold">{t.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {count} {t.items}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-border transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6">
                {/* Список блюд */}
                <div className="mt-4 space-y-1">
                  {selected.map(dish => (
                    <div key={dish.id} className="py-4 border-b border-border last:border-0">

                      {/* Название на языке гостя */}
                      <p className="font-semibold text-base leading-tight">
                        {dish.name}
                      </p>

                      {/* ✅ Название на турецком для официанта — только если язык не TR */}
                      {showTrName && dish.name_tr && dish.name_tr !== dish.name && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {dish.name_tr}
                        </p>
                      )}

                      {/* Цена + степпер */}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-muted-foreground text-sm">
                          {dish.price} ₺ × {dish.quantity}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground min-w-[52px] text-right">
                            {dish.price * dish.quantity} ₺
                          </span>

                          {/* Степпер */}
                          <div className="flex items-center gap-1 bg-muted rounded-xl px-1 py-1">
                            <button
                              onClick={() => onRemove(dish.id)}
                              className="w-8 h-8 rounded-lg bg-background text-foreground flex items-center justify-center text-lg font-bold hover:bg-border transition-colors shadow-sm"
                            >
                              −
                            </button>
                            <span className="text-lg font-bold min-w-[24px] text-center select-none">
                              {dish.quantity}
                            </span>
                            <button
                              onClick={() => onAdd(dish)}
                              className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-lg font-bold hover:bg-primary/90 transition-colors shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Итого */}
                <div className="mt-4 rounded-2xl bg-orange-50 px-4 py-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">{t.total}</span>
                  <span className="text-2xl font-bold text-primary">{total} ₺</span>
                </div>

                {/* Кнопка очистить */}
                <button
                  onClick={() => { onClear(); setOpen(false); }}
                  className="w-full mt-4 py-3.5 rounded-xl bg-destructive/10 text-destructive font-semibold hover:bg-destructive/20 transition-colors text-base"
                >
                  {t.clear}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}