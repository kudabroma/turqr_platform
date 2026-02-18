import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export type FeaturedDish = {
  id: number;
  name: string;
  price?: string | number;
  image?: string;
  description?: string;
};

type Props = {
  dishes: FeaturedDish[];
  // если хочешь другой маршрут для полного меню в админке — поменяй здесь
  fullMenuPath?: string;
};

export function FeaturedDishes({ dishes, fullMenuPath = "/admin/menu" }: Props) {
  const navigate = useNavigate();

  // show first 3 dishes by default
  const shown = dishes.slice(0, 3);

  return (
    <div className="px-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Featured Dishes</h2>

        <button
          onClick={() => navigate(fullMenuPath)}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Full Menu <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {shown.map((dish) => (
          <div
            key={dish.id}
            className="flex items-center gap-4 bg-card rounded-xl p-3 shadow-sm border border-border"
          >
            <div className="w-16 h-16 rounded-lg bg-[hsl(var(--warm-beige))] shrink-0 overflow-hidden">
              {dish.image ? (
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex-1">
              <span className="font-medium text-foreground">{dish.name}</span>
            </div>

            <span className="font-bold text-primary">
              {dish.price ?? ""}₺
            </span>
          </div>
        ))}

        {dishes.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No featured dishes yet.
          </div>
        )}
      </div>
    </div>
  );
}
