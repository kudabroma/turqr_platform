import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const mockFeatured = [
  { id: 1, name: "iskender kebab", price: 1500, image: "" },
  { id: 2, name: "greek salad", price: 150, image: "" },
  { id: 3, name: "baklava", price: 150, image: "" },
];

export function FeaturedDishes() {
  const navigate = useNavigate();

  return (
    <div className="px-4 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Featured Dishes</h2>
        <button
          onClick={() => navigate("/menu")}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Full Menu <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {mockFeatured.map((dish) => (
          <div
            key={dish.id}
            className="flex items-center gap-4 bg-card rounded-xl p-3 shadow-sm border border-border"
          >
            <div className="w-16 h-16 rounded-lg bg-[hsl(var(--warm-beige))] shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-foreground">{dish.name}</span>
            </div>
            <span className="font-bold text-primary">{dish.price}₺</span>
          </div>
        ))}
      </div>
    </div>
  );
}
