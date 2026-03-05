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
    refetchOnWindowFocus: false,
  });

  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: menuApi.get,
    refetchOnWindowFocus: false,
  });

  const restaurantTitle =
    restaurantQuery.data?.name ??
    (restaurantQuery.data?.id ? `Restaurant #${restaurantQuery.data.id}` : "Restaurant");

  // ✅ реальные фотки ресторана из API
  const photos: string[] = (() => {
    const r: any = restaurantQuery.data;
    if (!r) return [];

    const arr = [
      r.photo1_url,
      r.photo2_url,
      r.photo3_url,
      r.photo4_url,
      r.photo5_url,
      r.photo6_url,
    ].filter(Boolean);

    // fallback: иногда у тебя может быть заполнено photo1 (не *_url) или logo_url
    if (arr.length === 0) {
      const fallback = [r.photo1, r.logo_url, r.logo].filter(Boolean);
      return fallback as string[];
    }

    return arr as string[];
  })();

  // flatten dishes from /api/menu/ response
  const dishes =
    menuQuery.data?.flatMap((c) => c.dishes?.map((d) => ({ ...d, category_name: c.name })) ?? []) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader/>

      <div className="max-w-2xl mx-auto pb-28">
        {/* ✅ теперь карусель получает реальные фото */}
        <PhotoCarousel />


        {restaurantQuery.isLoading ? (
          <div className="px-4 mt-4 text-sm text-muted-foreground">Restoran yükleniyor...</div>
        ) : restaurantQuery.isError ? (
          <div className="px-4 mt-4 text-sm text-destructive">Restoran yüklenemedi</div>
        ) : restaurantQuery.data ? (
          <RestaurantInfo restaurant={restaurantQuery.data} />
        ) : (
          <div className="px-4 mt-4 text-sm text-muted-foreground">Restoran yok</div>
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
            Menüyü Düzenle
          </button>
        </div>
      </div>
    </div>
  );
}