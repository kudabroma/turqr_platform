import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/data/menuData';

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'tr', label: 'TR' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-card rounded-xl p-1 shadow-soft">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`language-btn ${
            language === lang.code ? 'language-btn-active' : 'language-btn-inactive'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
