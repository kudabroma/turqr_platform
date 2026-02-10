import { Flame, Leaf } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { uiTranslations } from '@/data/menuData';

interface FilterButtonsProps {
  veganActive: boolean;
  spicyActive: boolean;
  onVeganToggle: () => void;
  onSpicyToggle: () => void;
}

export function FilterButtons({
  veganActive,
  spicyActive,
  onVeganToggle,
  onSpicyToggle,
}: FilterButtonsProps) {
  const { language } = useLanguage();
  const ui = uiTranslations[language];

  return (
    <div className="flex gap-2">
      <button
        onClick={onVeganToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          veganActive
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-card text-muted-foreground hover:bg-secondary/20'
        }`}
      >
        <Leaf className="w-4 h-4" />
        {ui.vegan}
      </button>
      <button
        onClick={onSpicyToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          spicyActive
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-muted-foreground hover:bg-primary/20'
        }`}
      >
        <Flame className="w-4 h-4" />
        {ui.spicy}
      </button>
    </div>
  );
}
