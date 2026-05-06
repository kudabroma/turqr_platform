import { useLanguage } from "@/context/LanguageContext";
import { categories as demoCategories } from "@/data/menuData";
import type { Lang } from "@/api/public";  // добавить в импорты вверху


type CategoryOption = {
  id: number | null;
  label: string;
};

interface CategoryTabsProps {
  activeCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  categories?: CategoryOption[];
  lang?: Lang;
}

function normalizeLang(x: unknown): Lang {
  const v = String(x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ru")) return "ru";
  return "tr";
}

function getAllLabel(lang: Lang) {
  return lang === "tr" ? "Tümü" : lang === "ru" ? "Все" : "All";
}

export function CategoryTabs({
  activeCategoryId,
  onCategoryChange,
  categories,
  lang: langProp,
}: CategoryTabsProps) {
  const { language } = useLanguage();
  const lang = langProp ?? normalizeLang(language);

  const allLabel = getAllLabel(lang);

  // ✅ если дали реальные категории из API/UI — используем их
  const apiList =
    categories && categories.length > 0
      ? categories
      : null;

  // ✅ fallback на демо-категории
  const demoList = (demoCategories[lang] ?? demoCategories.en).map((label, index) => ({
    id: index + 1,
    label,
  }));

  const list: CategoryOption[] = apiList ?? [
    { id: null, label: allLabel },
    ...demoList,
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {list.map((category, index) => {
        const isAll = category.id === null;
        const isActive = activeCategoryId === category.id;

        return (
          <button
            key={category.id === null ? "all" : `${category.id}-${index}`}
            onClick={() => onCategoryChange(category.id)}
            className={`category-chip whitespace-nowrap ${
              isActive ? "category-chip-active" : "category-chip-inactive"
            }`}
          >
            {isAll ? allLabel : category.label}
          </button>
        );
      })}
    </div>
  );
}