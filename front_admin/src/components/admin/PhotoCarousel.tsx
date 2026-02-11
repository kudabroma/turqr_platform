import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { EditPhotosModal } from "./modals/EditPhotosModal";

const placeholderPhotos = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop",
];

export function PhotoCarousel() {
  const [current, setCurrent] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const photos = placeholderPhotos;

  const prev = () => setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1));

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-2xl mx-4 mt-4 aspect-[5/3]">
        <img
          src={photos[current]}
          alt={`Restaurant photo ${current + 1}`}
          className="w-full h-full object-cover"
        />
        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-2 shadow-md hover:bg-background transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur rounded-full p-2 shadow-md hover:bg-background transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
        {/* Edit button */}
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute bottom-3 right-3 bg-background/90 backdrop-blur text-foreground rounded-full p-2 shadow-md hover:bg-background transition-colors"
          title="Edit Photos"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-3">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-primary" : "w-2 bg-border"
            }`}
          />
        ))}
      </div>

      <EditPhotosModal open={showEditModal} onOpenChange={setShowEditModal} />
    </div>
  );
}
