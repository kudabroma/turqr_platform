// src/data/menuData.ts

export type PublicLang = string;
export type AllLang = string;

export type Translations<T> = Record<string, T>;

export interface MenuItem {
  id: string;
  category: string;
  price: number;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isGlutenFree?: boolean;
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

export interface Review {
  id: number;
  rating: number;
  translations: Translations<string>;
  author: string;
}

export interface RestaurantMeta {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

// =====================
// Отзывы и рейтинги по slug
// =====================
const defaultMeta: RestaurantMeta = {
  rating: 4.8,
  reviewCount: 127,
  reviews: [
    {
      id: 1,
      rating: 5,
      translations: {
        en: "Very cozy, fresh food, friendly staff",
        tr: "Çok rahat, taze yemek, güler yüzlü personel",
        ru: "Очень уютно, свежая еда, приветливый персонал",
      },
      author: "Sarah M.",
    },
    {
      id: 2,
      rating: 4,
      translations: {
        en: "Nice atmosphere and good prices",
        tr: "Güzel atmosfer ve iyi fiyatlar",
        ru: "Приятная атмосфера и хорошие цены",
      },
      author: "Ahmed K.",
    },
  ],
};

const restaurantMetaBySlug: Record<string, RestaurantMeta> = {
  demores: {
    rating: 4.8,
    reviewCount: 127,
    reviews: [
      {
        id: 1,
        rating: 5,
        translations: {
          en: "Very cozy, fresh food, friendly staff",
          tr: "Çok rahat, taze yemek, güler yüzlü personel",
          ru: "Очень уютно, свежая еда, приветливый персонал",
        },
        author: "Sarah M.",
      },
      {
        id: 2,
        rating: 4,
        translations: {
          en: "Nice atmosphere and good prices",
          tr: "Güzel atmosfer ve iyi fiyatlar",
          ru: "Приятная атмосфера и хорошие цены",
        },
        author: "Ahmed K.",
      },
    ],
  },
};

export function getRestaurantMeta(slug: string): RestaurantMeta {
  return restaurantMetaBySlug[slug] ?? defaultMeta;
}

// =====================
// Legacy export (оставляем для обратной совместимости)
// =====================
export const reviews = defaultMeta.reviews;

export const restaurantInfo: RestaurantInfo = {
  translations: {
    en: {
      name: "Test Restaurant",
      description: "Traditional Turkish cuisine with a cozy atmosphere",
      address: "123 Main Street, Istanbul, Turkey",
      hours: "Mon–Sun 10:00–23:00",
    },
    tr: {
      name: "Test Restoran",
      description: "Samimi atmosferde geleneksel Türk mutfağı",
      address: "123 Ana Cadde, İstanbul, Türkiye",
      hours: "Pzt–Paz 10:00–23:00",
    },
    ru: {
      name: "Тестовый ресторан",
      description: "Традиционная турецкая кухня в уютной атмосфере",
      address: "ул. Главная 123, Стамбул, Турция",
      hours: "Пн–Вс 10:00–23:00",
    },
  },
};

export const categories: Translations<string[]> = {
  en: ["All", "Main Dishes", "Appetizers", "Desserts", "Beverages"],
  tr: ["Tümü", "Ana Yemekler", "Mezeler", "Tatlılar", "İçecekler"],
  ru: ["Все", "Основные блюда", "Закуски", "Десерты", "Напитки"],
  de: ["Alle", "Hauptgerichte", "Vorspeisen", "Desserts", "Getränke"],
  no: ["Alle", "Hovedretter", "Forretter", "Desserter", "Drikker"],
  da: ["Alle", "Hovedretter", "Forretter", "Desserter", "Drikkevarer"],
  sv: ["Alla", "Huvudrätter", "Förrätter", "Desserter", "Drycker"],
  fi: ["Kaikki", "Pääruoat", "Alkuruoat", "Jälkiruoat", "Juomat"],
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
        description: "Spicy minced meat kebab grilled, served with flatbread and vegetables",
        category: "Main Dishes",
      },
      tr: {
        name: "Adana Kebap",
        description: "Baharatlı kıyma kebabı ızgarada pişirilmiş, lavaş ve sebzelerle servis edilir",
        category: "Ana Yemekler",
      },
      ru: {
        name: "Кебаб Адана",
        description: "Острый кебаб из рубленого мяса на гриле, подаётся с лавашом и овощами",
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
  vegetarian: string;
  spicy: string;
  glutenFree: string;
  currency: string;
  reviews: string;
  openNow: string;
  featuredDishes: string;
  fullMenu: string;
  back: string;
  allCategories: string;
  noDishesFound: string;
  loadingMenu: string;
  loading: string;
  closedNow: string;
}> = {
  en: {
    viewMenu: "View Menu",
    search: "Search dishes...",
    filters: "Filters",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    spicy: "Spicy",
    glutenFree: "Gluten-free",
    currency: "₺",
    reviews: "Reviews",
    openNow: "Open Now",
    featuredDishes: "Featured Dishes",
    fullMenu: "Full Menu",
    back: "Back",
    allCategories: "All",
    noDishesFound: "No dishes found",
    loadingMenu: "Loading menu...",
    loading: "Loading...",
    closedNow: "Closed",
  },
  tr: {
    viewMenu: "Menüyü Görüntüle",
    search: "Yemek ara...",
    filters: "Filtreler",
    vegan: "Vegan",
    vegetarian: "Vejetaryen",
    spicy: "Acılı",
    glutenFree: "Glutensiz",
    currency: "₺",
    reviews: "Yorumlar",
    openNow: "Açık",
    featuredDishes: "Öne Çıkan Yemekler",
    fullMenu: "Tam Menü",
    back: "Geri",
    allCategories: "Tümü",
    noDishesFound: "Yemek bulunamadı",
    loadingMenu: "Menü yükleniyor...",
    loading: "Yükleniyor...",
    closedNow: "Kapalı",
  },
  ru: {
    viewMenu: "Открыть меню",
    search: "Поиск блюд...",
    filters: "Фильтры",
    vegan: "Веган",
    vegetarian: "Вегетарианское",
    spicy: "Острое",
    glutenFree: "Без глютена",
    currency: "₺",
    reviews: "Отзывы",
    openNow: "Открыто",
    featuredDishes: "Рекомендует шеф",
    fullMenu: "Всё меню",
    back: "Назад",
    allCategories: "Все",
    noDishesFound: "Блюда не найдены",
    loadingMenu: "Загрузка меню...",
    loading: "Загрузка...",
    closedNow: "Закрыто",
  },
  de: {
    viewMenu: "Speisekarte ansehen",
    search: "Gerichte suchen...",
    filters: "Filter",
    vegan: "Vegan",
    vegetarian: "Vegetarisch",
    spicy: "Scharf",
    glutenFree: "Glutenfrei",
    currency: "₺",
    reviews: "Bewertungen",
    openNow: "Jetzt geöffnet",
    featuredDishes: "Empfohlene Gerichte",
    fullMenu: "Komplette Speisekarte",
    back: "Zurück",
    allCategories: "Alle",
    noDishesFound: "Keine Gerichte gefunden",
    loadingMenu: "Speisekarte wird geladen...",
    loading: "Wird geladen...",
    closedNow: "Geschlossen",
  },
  no: {
    viewMenu: "Vis meny",
    search: "Søk etter retter...",
    filters: "Filtre",
    vegan: "Vegansk",
    vegetarian: "Vegetar",
    spicy: "Sterk",
    glutenFree: "Glutenfri",
    currency: "₺",
    reviews: "Anmeldelser",
    openNow: "Åpent nå",
    featuredDishes: "Anbefalte retter",
    fullMenu: "Hele menyen",
    back: "Tilbake",
    allCategories: "Alle",
    noDishesFound: "Ingen retter funnet",
    loadingMenu: "Laster meny...",
    loading: "Laster...",
    closedNow: "Stengt",
  },
  da: {
    viewMenu: "Se menu",
    search: "Søg efter retter...",
    filters: "Filtre",
    vegan: "Vegansk",
    vegetarian: "Vegetarisk",
    spicy: "Stærk",
    glutenFree: "Glutenfri",
    currency: "₺",
    reviews: "Anmeldelser",
    openNow: "Åbent nu",
    featuredDishes: "Anbefalede retter",
    fullMenu: "Hele menuen",
    back: "Tilbage",
    allCategories: "Alle",
    noDishesFound: "Ingen retter fundet",
    loadingMenu: "Indlæser menu...",
    loading: "Indlæser...",
    closedNow: "Lukket",
  },
  sv: {
    viewMenu: "Visa meny",
    search: "Sök efter rätter...",
    filters: "Filter",
    vegan: "Vegansk",
    vegetarian: "Vegetarisk",
    spicy: "Stark",
    glutenFree: "Glutenfri",
    currency: "₺",
    reviews: "Recensioner",
    openNow: "Öppet nu",
    featuredDishes: "Utvalda rätter",
    fullMenu: "Hela menyn",
    back: "Tillbaka",
    allCategories: "Alla",
    noDishesFound: "Inga rätter hittades",
    loadingMenu: "Laddar menyn...",
    loading: "Laddar...",
    closedNow: "Stängt",
  },
  fi: {
    viewMenu: "Näytä ruokalista",
    search: "Hae ruokia...",
    filters: "Suodattimet",
    vegan: "Vegaani",
    vegetarian: "Kasvis",
    spicy: "Tulinen",
    glutenFree: "Gluteeniton",
    currency: "₺",
    reviews: "Arvostelut",
    openNow: "Avoinna nyt",
    featuredDishes: "Suositellut ruoat",
    fullMenu: "Koko ruokalista",
    back: "Takaisin",
    allCategories: "Kaikki",
    noDishesFound: "Ruokia ei löytynyt",
    loadingMenu: "Ladataan ruokalistaa...",
    loading: "Ladataan...",
    closedNow: "Suljettu",
  },
};