import { useLanguage } from "@/context/LanguageContext";
import { categories as demoCategories } from "@/data/menuData";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: string[]; // ✅ реальные категории из API
}

export function CategoryTabs({
  activeCategory,
  onCategoryChange,
  categories,
}: CategoryTabsProps) {
  const { language } = useLanguage();

  // ✅ если дали реальные категории — используем их
  const apiList = categories && categories.length > 0 ? categories : null;

  // fallback на демо
  const demoList = demoCategories[language] ?? demoCategories.en;
  const list = apiList ?? ["all", ...demoList.slice(1).map((_, i) => demoCategories.en[i + 1])];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {list.map((category, index) => {
        const value = index === 0 ? "all" : category;

        const isActive =
          (activeCategory === "all" && index === 0) || activeCategory === value;

        return (
          <button
            key={value}
            onClick={() => onCategoryChange(value)}
            className={`category-chip whitespace-nowrap ${
              isActive ? "category-chip-active" : "category-chip-inactive"
            }`}
          >
            {index === 0 ? (language === "ru" ? "Все" : language === "tr" ? "Tümü" : "All") : category}
          </button>
        );
      })}
    </div>
  );
}
