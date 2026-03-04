// src/data/menuData.ts

export type PublicLang = "en" | "tr";
export type AllLang = PublicLang | "ru";

// helper: en/tr обязаны, ru опционален
export type Translations<T> = Record<PublicLang, T> & Partial<Record<"ru", T>>;

export interface MenuItem {
  id: string;
  category: string;
  price: number;
  isVegan?: boolean;
  isSpicy?: boolean;
  image: string;

  translations: Translations<{
    name: string;
    description: string;
    category: string;
  }>;
}

export interface RestaurantInfo {
  translations: Translations<{
    name: string;
    description: string;
    address: string;
    hours: string;
  }>;
}

export const restaurantInfo: RestaurantInfo = {
  translations: {
    en: {
      name: "Test Restaurant",
      description:
        "Traditional Turkish cuisine with a cozy atmosphere for tourists and locals",
      address: "123 Main Street, Istanbul, Turkey",
      hours: "Mon–Sun 10:00–23:00",
    },
    tr: {
      name: "Test Restoran",
      description:
        "Turistler ve yerel halk için samimi bir atmosferde geleneksel Türk mutfağı",
      address: "123 Ana Cadde, İstanbul, Türkiye",
      hours: "Pzt–Paz 10:00–23:00",
    },
    // ru теперь можно оставить, но он НЕ обязателен
    ru: {
      name: "Тестовый Ресторан",
      description:
        "Традиционная турецкая кухня с уютной атмосферой для туристов и местных жителей",
      address: "Улица Мейн 123, Стамбул, Турция",
      hours: "Пн–Вс 10:00–23:00",
    },
  },
};

export const reviews = [
  {
    id: 1,
    rating: 5,
    translations: {
      en: "Very cozy, fresh food, friendly staff",
      tr: "Çok rahat, taze yemek, güler yüzlü personel",
      ru: "Очень уютно, свежая еда, дружелюбный персонал", // optional
    } as Translations<string>,
    author: "Sarah M.",
  },
  {
    id: 2,
    rating: 4,
    translations: {
      en: "Nice atmosphere and good prices",
      tr: "Güzel atmosfer ve iyi fiyatlar",
      ru: "Приятная атмосфера и хорошие цены",
    } as Translations<string>,
    author: "Ahmed K.",
  },
];

export const categories: Translations<string[]> = {
  en: ["All", "Main Dishes", "Appetizers", "Desserts", "Beverages"],
  tr: ["Tümü", "Ana Yemekler", "Mezeler", "Tatlılar", "İçecekler"],
  ru: ["Все", "Основные блюда", "Закуски", "Десерты", "Напитки"], // optional
};

export const menuItems: MenuItem[] = [
  {
    id: "adana-kebab",
    category: "Main Dishes",
    price: 450,
    isSpicy: true,
    image: "",
    translations: {
      en: {
        name: "Adana Kebab",
        description:
          "Spicy minced meat kebab grilled, served with flatbread and vegetables",
        category: "Main Dishes",
      },
      tr: {
        name: "Adana Kebap",
        description:
          "Baharatlı kıyma kebabı ızgarada pişirilmiş, lavaş ve sebzelerle servis edilir",
        category: "Ana Yemekler",
      },
      ru: {
        name: "Адана Кебаб",
        description:
          "Острый кебаб из рубленого мяса на гриле, подается с лепешкой и овощами",
        category: "Основные блюда",
      },
    },
  },
];

export const uiTranslations: Translations<{
  viewMenu: string;
  search: string;
  filters: string;
  vegan: string;
  spicy: string;
  currency: string;
  reviews: string;
  openNow: string;
  featuredDishes: string;
  fullMenu: string;
  back: string;
  allCategories: string;
}> = {
  en: {
    viewMenu: "View Menu",
    search: "Search dishes...",
    filters: "Filters",
    vegan: "Vegan",
    spicy: "Spicy",
    currency: "₺",
    reviews: "Reviews",
    openNow: "Open Now",
    featuredDishes: "Featured Dishes",
    fullMenu: "Full Menu",
    back: "Back",
    allCategories: "All",
  },
  tr: {
    viewMenu: "Menüyü Görüntüle",
    search: "Yemek ara...",
    filters: "Filtreler",
    vegan: "Vegan",
    spicy: "Acılı",
    currency: "₺",
    reviews: "Yorumlar",
    openNow: "Açık",
    featuredDishes: "Öne Çıkan Yemekler",
    fullMenu: "Tam Menü",
    back: "Geri",
    allCategories: "Tümü",
  },
  // ru можно оставить, но public-фронт его не использует
  ru: {
    viewMenu: "Посмотреть Меню",
    search: "Поиск блюд...",
    filters: "Фильтры",
    vegan: "Веган",
    spicy: "Острое",
    currency: "₺",
    reviews: "Отзывы",
    openNow: "Открыто",
    featuredDishes: "Популярные Блюда",
    fullMenu: "Полное Меню",
    back: "Назад",
    allCategories: "Все",
  },
};