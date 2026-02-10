import { Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { uiTranslations } from '@/data/menuData';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { language } = useLanguage();
  const ui = uiTranslations[language];

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ui.search}
        className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}
