import { Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ReviewCardProps {
  review: {
    id: number;
    rating: number;
    translations: Record<string, string>;
    author: string;
  };
}

// Демо-отзывы захардкожены только на паре языков (en/tr/ru) — для остальных
// enabled_languages показываем ближайший доступный перевод вместо пустоты.
function pickReviewText(translations: Record<string, string>, lang: string): string {
  return (
    translations[lang] ||
    translations.en ||
    translations.tr ||
    Object.values(translations).find(Boolean) ||
    ''
  );
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
      <p className="text-foreground text-sm mb-3 italic">"{pickReviewText(review.translations, language)}"</p>
      <p className="text-muted-foreground text-sm font-medium">— {review.author}</p>
    </div>
  );
}
