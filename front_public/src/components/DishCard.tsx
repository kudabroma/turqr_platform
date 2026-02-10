import { MenuItem, uiTranslations } from '@/data/menuData';
import { useLanguage } from '@/context/LanguageContext';
import { Flame, Leaf } from 'lucide-react';

interface DishCardProps {
  dish: MenuItem;
  variant?: 'full' | 'compact';
}

export function DishCard({ dish, variant = 'full' }: DishCardProps) {
  const { language } = useLanguage();
  const t = dish.translations[language];
  const ui = uiTranslations[language];

  if (variant === 'compact') {
    return (
      <div className="dish-card flex gap-3 p-3">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          {dish.image ? (
            <img src={dish.image} alt={t.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-display font-semibold text-foreground truncate">{t.name}</h4>
            <span className="price-tag whitespace-nowrap">{dish.price}{ui.currency}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dish-card animate-fade-in">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {dish.image ? (
          <img src={dish.image} alt={t.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg text-foreground">{t.name}</h3>
          <span className="price-tag text-lg whitespace-nowrap">{dish.price}{ui.currency}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{t.description}</p>
        <div className="flex items-center gap-2">
          {dish.isVegan && (
            <span className="filter-badge filter-badge-vegan">
              <Leaf className="w-3 h-3" />
              {ui.vegan}
            </span>
          )}
          {dish.isSpicy && (
            <span className="filter-badge filter-badge-spicy">
              <Flame className="w-3 h-3" />
              {ui.spicy}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
