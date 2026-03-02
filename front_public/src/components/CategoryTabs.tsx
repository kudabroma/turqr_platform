import { useLanguage } from "@/context/LanguageContext";
import { categories as demoCategories } from "@/data/menuData";

type Lang = "en" | "ru" | "tr";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: string[]; // реальные категории из API (уже с "all" в начале)
  lang?: Lang; // ✅ если передали — используем его (public через URL)
}

function normalizeLang(x: unknown): Lang {
  const v = String(x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ru")) return "ru";
  return "tr";
}

function getAllLabel(lang: Lang) {
  return lang === "ru" ? "Все" : lang === "tr" ? "Tümü" : "All";
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  categories,
  lang: langProp,
}: CategoryTabsProps) {
  const { language } = useLanguage();
  const lang = langProp ?? normalizeLang(language);

  // ✅ если дали реальные категории — используем их
  const apiList = categories && categories.length > 0 ? categories : null;

  // fallback на демо
  const demoList = demoCategories[lang] ?? demoCategories.en;
  const list = apiList ?? ["all", ...demoList];

  const allLabel = getAllLabel(lang);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {list.map((category, index) => {
        const value = index === 0 ? "all" : category;

        const isActive =
          (activeCategory === "all" && index === 0) || activeCategory === value;

        return (
          <button
            key={`${value}-${index}`}
            onClick={() => onCategoryChange(value)}
            className={`category-chip whitespace-nowrap ${
              isActive ? "category-chip-active" : "category-chip-inactive"
            }`}
          >
            {index === 0 ? allLabel : category}
          </button>
        );
      })}
    </div>
  );
}