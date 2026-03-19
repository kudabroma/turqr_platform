import { AdminHeader } from "@/components/admin/AdminHeader";
import { PhotoCarousel } from "@/components/admin/PhotoCarousel";
import { RestaurantInfo } from "@/components/admin/RestaurantInfo";
import { FeaturedDishes } from "@/components/admin/FeaturedDishes";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { restaurantApi, menuApi } from "@/api/endpoints";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function RestaurantPreview() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

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

    if (arr.length === 0) {
      const fallback = [r.photo1, r.logo_url, r.logo].filter(Boolean);
      return fallback as string[];
    }

    return arr as string[];
  })();

  const dishes =
    menuQuery.data?.flatMap((c) => c.dishes?.map((d) => ({ ...d, category_name: c.name })) ?? []) ?? [];

  const slug = (restaurantQuery.data as any)?.slug ?? "";
  const menuLink = slug ? `https://${slug}.turqr.com/menu` : "";

  const handleCopyMenuLink = async () => {
    if (!menuLink) return;

    try {
      await navigator.clipboard.writeText(menuLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Link kopyalanamadı", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-2xl mx-auto pb-28">
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

        <section className="px-4 mt-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-bold tracking-tight">QR Menu</h2>
            </div>

            {restaurantQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">QR yükleniyor...</div>
            ) : !slug ? (
              <div className="text-sm text-muted-foreground">QR için restoran slug bulunamadı</div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="rounded-2xl border border-border bg-white p-3 shadow-sm">
                  <img
                    src="https://turqrplatform-production.up.railway.app/api/admin/qr/png/"
                    alt="Restaurant QR"
                    className="w-48 h-48 object-contain"
                  />
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  Müşteriler menüyü açmak için bu QR kodu tarar
                </p>

                <div className="mt-3 w-full rounded-xl bg-muted px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground break-all text-left">
                    {menuLink}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyMenuLink}
                    className="shrink-0 inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-orange-500 hover:bg-background transition-colors"
                    aria-label="Menü linkini kopyala"
                    title={copied ? "Kopyalandı" : "Linki kopyala"}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <a
                    href="https://turqrplatform-production.up.railway.app/api/admin/qr/table-sticker/"
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 text-sm font-medium text-center transition-colors"
                  >
                    Sticker İndir
                  </a>

                  <a
                    href="https://turqrplatform-production.up.railway.app/api/admin/qr/png/"
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 text-sm font-medium text-center transition-colors"
                  >
                    QR İndir
                  </a>

                  <a
                    href="https://turqrplatform-production.up.railway.app/api/admin/qr/menu-a5/"
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 text-sm font-medium text-center transition-colors"
                  >
                    Menu A5 İndir
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

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
