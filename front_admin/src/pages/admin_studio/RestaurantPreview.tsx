import { AdminHeader } from "@/components/admin/AdminHeader";
import { PhotoCarousel } from "@/components/admin/PhotoCarousel";
import { RestaurantInfo } from "@/components/admin/RestaurantInfo";
import { ReviewsSection } from "@/components/admin/ReviewsSection";
import { FeaturedDishes } from "@/components/admin/FeaturedDishes";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { restaurantApi, menuApi } from "@/api/endpoints";

export default function RestaurantPreview() {
  const navigate = useNavigate();

  const restaurantQuery = useQuery({
    queryKey: ["restaurant", "me"],
    queryFn: restaurantApi.me,
  });

  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: menuApi.get,
  });

  const restaurantTitle =
    restaurantQuery.data?.name ??
    (restaurantQuery.data?.id ? `Restaurant #${restaurantQuery.data.id}` : "Restaurant");

  // flatten dishes from /api/menu/ response
  const dishes =
    menuQuery.data?.flatMap((c) => c.dishes?.map((d) => ({ ...d, category_name: c.name })) ?? []) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title={restaurantTitle} />

      <div className="max-w-2xl mx-auto pb-28">
        <PhotoCarousel />

        {restaurantQuery.isLoading ? (
          <div className="px-4 mt-4 text-sm text-muted-foreground">Loading restaurant...</div>
        ) : restaurantQuery.isError ? (
          <div className="px-4 mt-4 text-sm text-destructive">Failed to load restaurant</div>
        ) : restaurantQuery.data ? (
          <RestaurantInfo restaurant={restaurantQuery.data} />
        ) : (
          <div className="px-4 mt-4 text-sm text-muted-foreground">No restaurant</div>
        )}

        <ReviewsSection />

        <FeaturedDishes dishes={dishes} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate("/admin/menu")}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            Edit Menu
          </button>
        </div>
      </div>
    </div>
  );
}
