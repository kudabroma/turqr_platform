import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export type FeaturedDish = {
  id: number;
  name: string;
  price?: string | number;
  image?: string | null;
  image_url?: string | null; // ✅ добавили поддержку
  description?: string;
};

type Props = {
  dishes: FeaturedDish[];
  fullMenuPath?: string;
};

function formatPrice(price?: string | number) {
  if (price === undefined || price === null) return "";
  const num = typeof price === "string" ? Number(price) : price;
  if (!Number.isNaN(num)) return `${num.toFixed(2)}₺`;
  return `${price}₺`;
}

export function FeaturedDishes({ dishes, fullMenuPath = "/admin/menu" }: Props) {
  const navigate = useNavigate();

  const shown = dishes.slice(0, 3);

  return (
    <div className="px-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Öne Çıkan Yemekler</h2>

        <button
          onClick={() => navigate(fullMenuPath)}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Tam Menü <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {shown.map((dish) => {
          const img = dish.image_url ?? dish.image ?? null;

          return (
            <div
              key={dish.id}
              className="flex items-center gap-4 bg-card rounded-xl p-3 shadow-sm border border-border"
            >
              {/* мини фото */}
              <div className="w-16 h-16 rounded-lg bg-[hsl(var(--warm-beige))] shrink-0 overflow-hidden flex items-center justify-center">
                {img ? (
                  <img
                    src={img}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>

              {/* название */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground truncate block">
                  {dish.name}
                </span>
              </div>

              {/* цена */}
              <span className="font-bold text-primary whitespace-nowrap">
                {formatPrice(dish.price)}
              </span>
            </div>
          );
        })}

        {dishes.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Henüz öne çıkan yemek yok.
          </div>
        )}
      </div>
    </div>
  );
}