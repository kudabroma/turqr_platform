import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/api/endpoints";
import { EditPhotosModal } from "@/components/admin/modals/EditPhotosModal";
export function PhotoCarousel() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const restaurantQuery = useQuery({
    queryKey: ["restaurant", "me"],
    queryFn: restaurantApi.me,
    refetchOnWindowFocus: false,
  });

  const photos = useMemo(() => {
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

    // fallback (на случай если *_url нет, но есть что-то другое)
    if (arr.length === 0) {
      return [r.photo1, r.logo_url, r.logo].filter(Boolean) as string[];
    }

    return arr as string[];
  }, [restaurantQuery.data]);

  const title = restaurantQuery.data?.name ?? "Restaurant";

  const images = useMemo(() => photos.filter(Boolean), [photos]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images.length]);

  const hasImages = images.length > 0;

  const prev = () => {
    if (!hasImages) return;
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  const next = () => {
    if (!hasImages) return;
    setIndex((i) => (i + 1) % images.length);
  };

  const handleModalChange = (v: boolean) => {
    setOpen(v);
    // когда модалка закрылась — обновим ресторан (чтобы новые фото сразу появились)
    if (!v) {
      queryClient.invalidateQueries({ queryKey: ["restaurant", "me"] });
    }
  };

  return (
    <div className="relative mt-4 px-4">
      <div className="relative overflow-hidden rounded-3xl bg-muted aspect-[16/10]">
        {restaurantQuery.isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Fotoğraflar yükleniyor...
          </div>
        ) : hasImages ? (
          <img
            src={images[index]}
            alt={`${title} photo ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Henüz fotoğraf yok
          </div>
        )}

        {/* ✅ кнопка редактирования фото (возвращаем как было по смыслу) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-4 bottom-4 h-10 w-10 rounded-full bg-background/90 hover:bg-background shadow flex items-center justify-center"
          aria-label="Edit photos"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* arrows */}
        {hasImages && images.length > 1 && (
          <>
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Button type="button" variant="secondary" size="icon" className="rounded-full" onClick={prev}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button type="button" variant="secondary" size="icon" className="rounded-full" onClick={next}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {/* dots */}
        {hasImages && images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition-opacity ${
                  i === index ? "bg-white/90" : "bg-white/40"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ твоя модалка */}
      <EditPhotosModal open={open} onOpenChange={handleModalChange} />
    </div>
  );
}