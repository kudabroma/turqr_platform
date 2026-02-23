import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Pencil, Plus, Settings } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { EditCategoriesModal } from "@/components/admin/modals/EditCategoriesModal";
import { EditDishModal, type DishData } from "@/components/admin/modals/EditDishModal";

import {
  menuApi,
  restaurantApi,
  categoriesApi,
  type CategoryWithDishes,
  dishesApi,
} from "@/api/endpoints";

export default function MenuPage() {
  const qc = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingDish, setEditingDish] = useState<DishData | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);

  // ✅ ресторан (для title)
  const restaurantQuery = useQuery({
    queryKey: ["restaurant", "me"],
    queryFn: restaurantApi.me,
    staleTime: 60_000,
  });

  const headerTitle =
    restaurantQuery.data?.name ??
    (restaurantQuery.data?.id
      ? `Restaurant #${restaurantQuery.data.id}`
      : "Restaurant");

  // ✅ меню
  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: menuApi.get,
    staleTime: 10_000,
  });

  const categoriesRaw = (menuQuery.data ?? []) as CategoryWithDishes[];

  // ✅ категории (для табов): string[]
  const categories = useMemo(
    () => categoriesRaw.map((c) => c.name),
    [categoriesRaw]
  );

  // ✅ категории для модалки: {id, name}[]
  const categoriesForModal = useMemo(
    () => categoriesRaw.map((c) => ({ id: c.id, name: c.name })),
    [categoriesRaw]
  );

  // ✅ плоский список блюд
  const dishes: DishData[] = useMemo(() => {
    return categoriesRaw.flatMap((c) =>
      (c.dishes ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description ?? "",
        price: typeof d.price === "string" ? Number(d.price) : d.price ?? 0,
        image: "",
        vegan: false,
        spicy: false,
        featured: false,
        _categoryName: c.name,
        _categoryId: c.id,
      }))
    );
  }, [categoriesRaw]);

  // если активная категория исчезла — сбрасываем
  useEffect(() => {
    if (activeCategory && !categories.includes(activeCategory)) {
      setActiveCategory(null);
    }
  }, [activeCategory, categories]);

  const filteredDishes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dishes.filter((d: any) => {
      const matchesSearch = !q || d.name.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || d._categoryName === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [dishes, search, activeCategory]);

  const groupedByCategory = useMemo(() => {
    if (!activeCategory) {
      return categories.map((cat) => ({
        category: cat,
        dishes: filteredDishes.filter((d: any) => d._categoryName === cat),
      }));
    }
    return [{ category: activeCategory, dishes: filteredDishes }];
  }, [activeCategory, categories, filteredDishes]);

// ---- блюда (CRUD) ----
const handleSaveDish = async (dish: DishData) => {
  // ✅ category обязательна на backend
  const categoryId =
    dish._categoryId ??
    editingDish?._categoryId ??
    (activeCategory
      ? categoriesRaw.find((c) => c.name === activeCategory)?.id
      : undefined);

  if (!categoryId) {
    alert("Choose a category first (open a category tab), then add a dish.");
    return;
  }

  const payload = {
    name: dish.name,
    description: dish.description ?? "",
    price: String(dish.price),
    category: categoryId,
  };

  try {
    if (dish.id && dish.id > 0) {
      // update
      await dishesApi.update(dish.id, payload);
    } else {
      // create
      await dishesApi.create(payload);
    }

    await qc.invalidateQueries({ queryKey: ["menu"] });
    setShowDishModal(false);
    setEditingDish(null);
  } catch (e) {
    console.error(e);
    alert("Failed to save dish. Check console/network.");
  }
};

const handleDeleteDish = async (id: number) => {
  try {
    await dishesApi.delete(id);
    await qc.invalidateQueries({ queryKey: ["menu"] });
    setShowDishModal(false);
    setEditingDish(null);
  } catch (e) {
    console.error(e);
    alert("Failed to delete dish. Check console/network.");
  }
};

const openNewDish = () => {
  // ✅ чтобы "Add new dish" создавалось именно в выбранной категории
  const categoryId = activeCategory
    ? categoriesRaw.find((c) => c.name === activeCategory)?.id
    : undefined;

  setEditingDish(
    categoryId
      ? ({
          id: undefined,
          name: "",
          description: "",
          price: 0,
          image: "",
          vegan: false,
          spicy: false,
          featured: false,
          _categoryId: categoryId,
          _categoryName: activeCategory ?? "",
        } as any)
      : null
  );

  setShowDishModal(true);
};

const openEditDish = (dish: DishData) => {
  setEditingDish(dish);
  setShowDishModal(true);
};

  // ✅ onSave для модалки категорий
  const handleSaveCategories = async (payload: {
    create: { name: string }[];
    rename: { id: number; name: string }[];
    delete: { id: number }[];
  }) => {
    // 1) create
    if (payload.create.length) {
      await Promise.all(payload.create.map((c) => categoriesApi.create({ name: c.name })));
    }

    // 2) rename (PATCH)
    if (payload.rename.length) {
      await Promise.all(
        payload.rename.map((c) => categoriesApi.update(c.id, { name: c.name }))
      );
    }

    // 3) delete
    if (payload.delete.length) {
      await Promise.all(payload.delete.map((c) => categoriesApi.delete(c.id)));
    }

    // 4) refresh menu
    await qc.invalidateQueries({ queryKey: ["menu"] });
  };

  // ---- loading/error ----
  if (menuQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader title={headerTitle} showBack />
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">Loading menu…</div>
      </div>
    );
  }

  if (menuQuery.isError) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader title={headerTitle} showBack />
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
          <div className="font-medium">Failed to load menu</div>
          <div className="text-sm opacity-70">
            Check Network: GET /api/menu/ (should be 200)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title={headerTitle} showBack />

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-border"
            }`}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-border"
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setShowCategoriesModal(true)}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors shrink-0"
            title="Edit Categories"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Dishes grouped */}
        {groupedByCategory.map(({ category, dishes: catDishes }) => (
          <div key={category} className="mt-6">
            <h3 className="text-lg font-bold text-foreground mb-3">{category}</h3>

            <div className="grid grid-cols-2 gap-3">
              {activeCategory && (
                <button
                  onClick={openNewDish}
                  className="aspect-[4/5] rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-sm font-medium">Add new dish</span>
                </button>
              )}

              {catDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="rounded-xl bg-card border border-border shadow-sm overflow-hidden relative group"
                >
                  <div className="aspect-[4/3] bg-[hsl(var(--warm-beige))]">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">
                      {dish.name}
                    </span>
                    <span className="font-bold text-sm text-primary">
                      {dish.price}₺
                    </span>
                  </div>

                  <button
                    onClick={() => openEditDish(dish)}
                    className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3.5 w-3.5 text-foreground" />
                  </button>
                </div>
              ))}

              {catDishes.length === 0 && (
                <div className="col-span-2 text-sm text-muted-foreground">
                  No dishes in this category yet.
                </div>
              )}
            </div>
          </div>
        ))}

        {!activeCategory && (
          <div className="mt-6">
            <button
              onClick={openNewDish}
              className="w-full py-4 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add new dish</span>
            </button>
          </div>
        )}
      </div>

      {/* ✅ Categories CRUD modal */}
      <EditCategoriesModal
        open={showCategoriesModal}
        onOpenChange={setShowCategoriesModal}
        categories={categoriesForModal}
        onSave={handleSaveCategories}
      />

      <EditDishModal
        open={showDishModal}
        onOpenChange={setShowDishModal}
        dish={editingDish}
        onSave={handleSaveDish}
        onDelete={handleDeleteDish}
      />
    </div>
  );
}