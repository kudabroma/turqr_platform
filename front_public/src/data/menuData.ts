export type Language = 'en' | 'ru' | 'tr';

export interface MenuItem {
  id: string;
  category: string;
  price: number;
  isVegan?: boolean;
  isSpicy?: boolean;
  image: string;
  translations: {
    [key in Language]: {
      name: string;
      description: string;
      category: string;
    };
  };
}

export interface RestaurantInfo {
  translations: {
    [key in Language]: {
      name: string;
      description: string;
      address: string;
      hours: string;
    };
  };
}

export const restaurantInfo: RestaurantInfo = {
  translations: {
    en: {
      name: "Test Restaurant",
      description: "Traditional Turkish cuisine with a cozy atmosphere for tourists and locals",
      address: "123 Main Street, Istanbul, Turkey",
      hours: "Mon–Sun 10:00–23:00",
    },
    ru: {
      name: "Тестовый Ресторан",
      description: "Традиционная турецкая кухня с уютной атмосферой для туристов и местных жителей",
      address: "Улица Мейн 123, Стамбул, Турция",
      hours: "Пн–Вс 10:00–23:00",
    },
    tr: {
      name: "Test Restoran",
      description: "Turistler ve yerel halk için samimi bir atmosferde geleneksel Türk mutfağı",
      address: "123 Ana Cadde, İstanbul, Türkiye",
      hours: "Pzt–Paz 10:00–23:00",
    },
  },
};

export const reviews = [
  {
    id: 1,
    rating: 5,
    translations: {
      en: "Very cozy, fresh food, friendly staff",
      ru: "Очень уютно, свежая еда, дружелюбный персонал",
      tr: "Çok rahat, taze yemek, güler yüzlü personel",
    },
    author: "Sarah M.",
  },
  {
    id: 2,
    rating: 4,
    translations: {
      en: "Nice atmosphere and good prices",
      ru: "Приятная атмосфера и хорошие цены",
      tr: "Güzel atmosfer ve iyi fiyatlar",
    },
    author: "Ahmed K.",
  },
  {
    id: 3,
    rating: 5,
    translations: {
      en: "Authentic Turkish flavors, highly recommend!",
      ru: "Аутентичные турецкие вкусы, очень рекомендую!",
      tr: "Otantik Türk lezzetleri, kesinlikle tavsiye ederim!",
    },
    author: "Maria L.",
  },
];

export const categories = {
  en: ["All", "Main Dishes", "Appetizers", "Desserts", "Beverages"],
  ru: ["Все", "Основные блюда", "Закуски", "Десерты", "Напитки"],
  tr: ["Tümü", "Ana Yemekler", "Mezeler", "Tatlılar", "İçecekler"],
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
      ru: {
        name: "Адана Кебаб",
        description: "Острый кебаб из рубленого мяса на гриле, подается с лепешкой и овощами",
        category: "Основные блюда",
      },
      tr: {
        name: "Adana Kebap",
        description: "Baharatlı kıyma kebabı ızgarada pişirilmiş, lavaş ve sebzelerle servis edilir",
        category: "Ana Yemekler",
      },
    },
  },
  {
    id: "hummus",
    category: "Appetizers",
    price: 250,
    isVegan: true,
    image: "",
    translations: {
      en: {
        name: "Hummus",
        description: "Classic Turkish hummus with olive oil and fresh herbs",
        category: "Appetizers",
      },
      ru: {
        name: "Хумус",
        description: "Классический турецкий хумус с оливковым маслом и свежими травами",
        category: "Закуски",
      },
      tr: {
        name: "Humus",
        description: "Zeytinyağı ve taze otlarla klasik Türk humusu",
        category: "Mezeler",
      },
    },
  },
  {
    id: "baklava",
    category: "Desserts",
    price: 180,
    image: "",
    translations: {
      en: {
        name: "Baklava",
        description: "Sweet pastry with nuts and honey syrup",
        category: "Desserts",
      },
      ru: {
        name: "Пахлава",
        description: "Сладкая выпечка с орехами и медовым сиропом",
        category: "Десерты",
      },
      tr: {
        name: "Baklava",
        description: "Cevizli ve ballı şerbet ile tatlı hamur işi",
        category: "Tatlılar",
      },
    },
  },
  {
    id: "iskender",
    category: "Main Dishes",
    price: 520,
    image: "",
    translations: {
      en: {
        name: "Iskender Kebab",
        description: "Thinly sliced döner meat over pita bread with tomato sauce and melted butter",
        category: "Main Dishes",
      },
      ru: {
        name: "Искендер Кебаб",
        description: "Тонко нарезанное мясо донер на лаваше с томатным соусом и растопленным маслом",
        category: "Основные блюда",
      },
      tr: {
        name: "İskender Kebap",
        description: "Pide üzerinde ince dilimlenmiş döner, domates sosu ve eritilmiş tereyağı ile",
        category: "Ana Yemekler",
      },
    },
  },
  {
    id: "cacik",
    category: "Appetizers",
    price: 120,
    isVegan: false,
    image: "",
    translations: {
      en: {
        name: "Cacık",
        description: "Refreshing yogurt dip with cucumber, garlic, and mint",
        category: "Appetizers",
      },
      ru: {
        name: "Джаджик",
        description: "Освежающий йогуртовый соус с огурцом, чесноком и мятой",
        category: "Закуски",
      },
      tr: {
        name: "Cacık",
        description: "Salatalık, sarımsak ve nane ile ferahlatıcı yoğurt sosu",
        category: "Mezeler",
      },
    },
  },
  {
    id: "kunefe",
    category: "Desserts",
    price: 220,
    image: "",
    translations: {
      en: {
        name: "Künefe",
        description: "Warm cheese pastry soaked in sweet syrup with crushed pistachios",
        category: "Desserts",
      },
      ru: {
        name: "Кюнефе",
        description: "Теплая сырная выпечка в сладком сиропе с молотыми фисташками",
        category: "Десерты",
      },
      tr: {
        name: "Künefe",
        description: "Tatlı şerbete batırılmış sıcak peynirli hamur işi, ezilmiş fıstıkla",
        category: "Tatlılar",
      },
    },
  },
  {
    id: "turkish-tea",
    category: "Beverages",
    price: 40,
    isVegan: true,
    image: "",
    translations: {
      en: {
        name: "Turkish Tea",
        description: "Traditional black tea served in a tulip-shaped glass",
        category: "Beverages",
      },
      ru: {
        name: "Турецкий Чай",
        description: "Традиционный черный чай в стакане в форме тюльпана",
        category: "Напитки",
      },
      tr: {
        name: "Türk Çayı",
        description: "Lale şeklinde bardakta servis edilen geleneksel siyah çay",
        category: "İçecekler",
      },
    },
  },
  {
    id: "ayran",
    category: "Beverages",
    price: 50,
    isVegan: false,
    image: "",
    translations: {
      en: {
        name: "Ayran",
        description: "Cold yogurt drink with a touch of salt",
        category: "Beverages",
      },
      ru: {
        name: "Айран",
        description: "Холодный йогуртовый напиток с щепоткой соли",
        category: "Напитки",
      },
      tr: {
        name: "Ayran",
        description: "Hafif tuzlu soğuk yoğurt içeceği",
        category: "İçecekler",
      },
    },
  },
];

export const uiTranslations = {
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
};
