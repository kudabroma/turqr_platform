import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
      {photos.length > 0 ? (
        <>
          <img
            src={photos[currentIndex]}
            alt={`Restaurant photo ${currentIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 gradient-hero pointer-events-none" />
          
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-primary-foreground w-6'
                        : 'bg-primary-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
      )}
    </div>
  );
}
