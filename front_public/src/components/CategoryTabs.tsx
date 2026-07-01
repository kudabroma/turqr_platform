import { useLanguage } from "@/context/LanguageContext";
import { categories as demoCategories } from "@/data/menuData";
import { getRawLang } from "@/utils/lang";
import type { Lang } from "@/api/public";


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

export function CategoryTabs({
  activeCategoryId,
  onCategoryChange,
  categories,
  lang: langProp,
}: CategoryTabsProps) {
  const { language } = useLanguage();
  const lang = langProp ?? getRawLang(language);

  // ✅ если дали реальные категории из API/UI — используем их
  const apiList =
    categories && categories.length > 0
      ? categories
      : null;

  // ✅ fallback на демо-категории (первый элемент списка — "All"/"Tümü"/...)
  const demoLabels = demoCategories[lang] ?? demoCategories.en;
  const [allLabel, ...restLabels] = demoLabels;
  const demoList = restLabels.map((label, index) => ({
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