import { AdminHeader } from "@/components/admin/AdminHeader";
import { PhotoCarousel } from "@/components/admin/PhotoCarousel";
import { RestaurantInfo } from "@/components/admin/RestaurantInfo";
import { ReviewsSection } from "@/components/admin/ReviewsSection";
import { FeaturedDishes } from "@/components/admin/FeaturedDishes";
import { useNavigate } from "react-router-dom";

export default function RestaurantPreview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="TurQR" />
      <div className="max-w-2xl mx-auto pb-28">
        <PhotoCarousel />
        <RestaurantInfo />
        <ReviewsSection />
        <FeaturedDishes />
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t border-border">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/admin/menu")}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            View Menu
          </button>
        </div>
      </div>
    </div>
  );
}
