import { Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/data/menuData';

interface ReviewCardProps {
  review: {
    id: number;
    rating: number;
    translations: { [key in Language]: string };
    author: string;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { language } = useLanguage();

  return (
    <div className="card-restaurant p-4 min-w-[280px] max-w-[300px] flex-shrink-0 animate-fade-in">
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? 'fill-accent text-accent' : 'text-muted'
            }`}
          />
        ))}
      </div>
      <p className="text-foreground text-sm mb-3 italic">"{review.translations[language]}"</p>
      <p className="text-muted-foreground text-sm font-medium">— {review.author}</p>
    </div>
  );
}
