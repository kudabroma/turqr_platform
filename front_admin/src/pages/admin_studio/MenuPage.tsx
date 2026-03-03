import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Pencil, Plus, Settings } from "lucide-react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { EditCategoriesModal } from "@/components/admin/modals/EditCategoriesModal";
import { EditDishModal, type DishData } from "@/components/admin/modals/EditDishModal";

import {
  menuApi,
  categoriesApi,
  type CategoryWithDishes,
  dishesApi,
} from "@/api/endpoints";

export default function MenuPage() {
  const qc = useQueryClient();

  // ✅ активная категория по ID
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingDish, setEditingDish] = useState<DishData | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);

  // ✅ меню (категории + блюда)
  const menuQuery = useQuery({
    queryKey: ["menu"],
    queryFn: menuApi.get,
    staleTime: 10_000,
  });

  // ✅ категории CRUD (для bilingual редактирования)
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
    staleTime: 10_000,
  });

  const categoriesRaw = (menuQuery.data ?? []) as CategoryWithDishes[];

  /**
   * ✅ system категории (Unsorted) всегда в конце.
   */
  const categoriesRawSorted = useMemo(() => {
    return [...categoriesRaw].sort((a: any, b: any) => {
      const aSys = a?.is_system ? 1 : 0;
      const bSys = b?.is_system ? 1 : 0;
      if (aSys !== bSys) return aSys - bSys; // system -> last
      return (a?.id ?? 0) - (b?.id ?? 0);
    });
  }, [categoriesRaw]);

  // ✅ список категорий для табов
  const categoriesForTabs = useMemo(() => {
    return categoriesRawSorted.map((c) => ({
      id: c.id,
      name: c.name,
      is_system: (c as any).is_system,
    }));
  }, [categoriesRawSorted]);

  // ✅ категории для модалки: bilingual payload
  const categoriesForModal = useMemo(() => {
    const source = (categoriesQuery.data ?? []) as any[];
    return [...source]
      .sort((a: any, b: any) => {
        const aSys = a?.is_system ? 1 : 0;
        const bSys = b?.is_system ? 1 : 0;
        if (aSys !== bSys) return aSys - bSys;
        return (a?.id ?? 0) - (b?.id ?? 0);
      })
      .map((c) => ({
        id: c.id,
        name_tr: c.name_tr ?? c.name ?? "",
        name_en: c.name_en ?? "",
      }));
  }, [categoriesQuery.data]);

  // ✅ категории для выбора в блюде (исключаем system)
  const dishCategoryOptions = useMemo(() => {
    return categoriesRawSorted
      .filter((c: any) => !c.is_system)
      .map((c) => ({ id: c.id, name: c.name }));
  }, [categoriesRawSorted]);

  // ✅ плоский список блюд
  const dishes: DishData[] = useMemo(() => {
    return categoriesRawSorted.flatMap((c) =>
      (c.dishes ?? []).map((d: any) => ({
        id: d.id,

        name_tr: d.name_tr ?? d.name ?? "",
        name_en: d.name_en ?? "",
        description_tr: d.description_tr ?? d.description ?? "",
        description_en: d.description_en ?? "",

        price: typeof d.price === "string" ? Number(d.price) : d.price ?? 0,

        image: d.image_url ?? d.image ?? "",
        imageFile: null,

        vegan: false,
        spicy: false,
        featured: false,

        _categoryName: c.name,
        _categoryId: c.id,
      }))
    );
  }, [categoriesRawSorted]);

  // если активная категория исчезла — сбрасываем
  useEffect(() => {
    if (activeCategoryId === null) return;
    const stillExists = categoriesRawSorted.some((c) => c.id === activeCategoryId);
    if (!stillExists) setActiveCategoryId(null);
  }, [activeCategoryId, categoriesRawSorted]);

  const filteredDishes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dishes.filter((d: any) => {
      const hay = `${d.name_tr ?? ""} ${d.name_en ?? ""}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      const matchesCategory = activeCategoryId === null || d._categoryId === activeCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [dishes, search, activeCategoryId]);

  const groupedByCategory = useMemo(() => {
    if (activeCategoryId === null) {
      return categoriesForTabs.map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        dishes: filteredDishes.filter((d: any) => d._categoryId === cat.id),
      }));
    }

    const cat = categoriesForTabs.find((c) => c.id === activeCategoryId);
    return [
      {
        categoryId: activeCategoryId,
        categoryName: cat?.name ?? "Kategori",
        dishes: filteredDishes,
      },
    ];
  }, [activeCategoryId, categoriesForTabs, filteredDishes]);

  // ---- блюда (CRUD) ----
  const handleSaveDish = async (dish: DishData) => {
    const categoryId =
      (dish as any)._categoryId ??
      (editingDish as any)?._categoryId ??
      activeCategoryId ??
      undefined;

    if (!categoryId) {
      alert("Lütfen bu yemek için bir kategori seçin.");
      return;
    }

    if (!dish.name_tr?.trim()) {
      alert("İsim (TR) zorunludur.");
      return;
    }

    try {
      // ✅ multipart/form-data
      if (dish.imageFile) {
        const fd = new FormData();
        fd.append("name_tr", dish.name_tr);
        fd.append("name_en", dish.name_en ?? "");
        fd.append("description_tr", dish.description_tr ?? "");
        fd.append("description_en", dish.description_en ?? "");
        fd.append("price", String(dish.price ?? 0));
        fd.append("category", String(Number(categoryId)));
        fd.append("image", dish.imageFile);

        if (dish.id && dish.id > 0) {
          await (dishesApi as any).updateForm(dish.id, fd);
        } else {
          await (dishesApi as any).createForm(fd);
        }

        await qc.invalidateQueries({ queryKey: ["menu"] });
        setShowDishModal(false);
        setEditingDish(null);
        return;
      }

      // ✅ JSON путь
      const payload: any = {
        name_tr: dish.name_tr,
        name_en: dish.name_en ?? "",
        description_tr: dish.description_tr ?? "",
        description_en: dish.description_en ?? "",
        price: String(dish.price ?? 0),
        category: Number(categoryId),
      };

      if (dish.id && dish.id > 0) {
        await dishesApi.update(dish.id, payload);
      } else {
        await dishesApi.create(payload);
      }

      await qc.invalidateQueries({ queryKey: ["menu"] });
      setShowDishModal(false);
      setEditingDish(null);
    } catch (e) {
      console.error(e);
      alert("Yemek kaydedilemedi. Konsolu / Network'ü kontrol edin.");
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
      alert("Yemek silinemedi. Konsolu / Network'ü kontrol edin.");
    }
  };

  const openNewDish = () => {
    const active = activeCategoryId
      ? categoriesRawSorted.find((c) => c.id === activeCategoryId)
      : undefined;

    let defaultCategoryId: number | undefined =
      active && !(active as any).is_system ? active.id : undefined;

    if (!defaultCategoryId) {
      defaultCategoryId = categoriesRawSorted.find((c: any) => !c.is_system)?.id;
    }

    const defaultCategoryName =
      defaultCategoryId
        ? categoriesRawSorted.find((c) => c.id === defaultCategoryId)?.name
        : undefined;

    setEditingDish({
      id: 0,
      name_tr: "",
      name_en: "",
      description_tr: "",
      description_en: "",
      price: 0,
      image: "",
      imageFile: null,
      vegan: false,
      spicy: false,
      featured: false,
      ...(defaultCategoryId ? ({ _categoryId: defaultCategoryId } as any) : {}),
      ...(defaultCategoryName ? ({ _categoryName: defaultCategoryName } as any) : {}),
    });

    setShowDishModal(true);
  };

  const openEditDish = async (dish: DishData) => {
    setShowDishModal(true);
    setEditingDish(dish);

    try {
      if (!dish.id) return;
      const full = await (dishesApi as any).get(dish.id);

      setEditingDish({
        id: full.id,
        name_tr: full.name_tr ?? "",
        name_en: full.name_en ?? "",
        description_tr: full.description_tr ?? "",
        description_en: full.description_en ?? "",
        price: typeof full.price === "string" ? Number(full.price) : full.price ?? 0,
        image: full.image_url ?? full.image ?? "",
        imageFile: null,
        vegan: false,
        spicy: false,
        featured: false,
        _categoryId: (full as any).category ?? dish._categoryId,
        _categoryName:
          categoriesRawSorted.find((c) => c.id === ((full as any).category ?? dish._categoryId))
            ?.name ?? dish._categoryName,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCategories = async (payload: {
    create: { name_tr: string; name_en: string }[];
    rename: { id: number; name_tr: string; name_en: string }[];
    delete: { id: number }[];
  }) => {
    try {
      if (payload.create.length) {
        await Promise.all(
          payload.create.map((c) =>
            categoriesApi.create({ name_tr: c.name_tr, name_en: c.name_en ?? "" } as any)
          )
        );
      }

      if (payload.rename.length) {
        await Promise.all(
          payload.rename.map((c) =>
            categoriesApi.update(c.id, { name_tr: c.name_tr, name_en: c.name_en ?? "" } as any)
          )
        );
      }

      if (payload.delete.length) {
        await Promise.all(payload.delete.map((c) => categoriesApi.delete(c.id)));
      }

      await qc.invalidateQueries({ queryKey: ["categories"] });
      await qc.invalidateQueries({ queryKey: ["menu"] });
    } catch (e) {
      console.error(e);
      alert("Kategoriler kaydedilemedi. Konsolu / Network'ü kontrol edin.");
    }
  };

  // ---- loading/error ----
  if (menuQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader showBack />
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">Menü yükleniyor…</div>
      </div>
    );
  }

  if (menuQuery.isError) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader showBack />
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
          <div className="font-medium">Menü yüklenemedi</div>
          <div className="text-sm opacity-70">
            Network kontrol: GET /api/menu/ (200 olmalı)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader showBack />

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Yemek ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategoryId === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-border"
            }`}
          >
            Tümü
          </button>

          {categoriesForTabs.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategoryId === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-border"
              }`}
            >
              {cat.name}
            </button>
          ))}

          <button
            onClick={() => setShowCategoriesModal(true)}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors shrink-0"
            title="Kategorileri Düzenle"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Dishes grouped */}
        {groupedByCategory.map(({ categoryId, categoryName, dishes: catDishes }) => (
          <div key={categoryId} className="mt-6">
            <h3 className="text-lg font-bold text-foreground mb-3">{categoryName}</h3>

            <div className="grid grid-cols-2 gap-3">
              {activeCategoryId !== null && (
                <button
                  onClick={openNewDish}
                  className="aspect-[4/5] rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-sm font-medium">Yeni yemek ekle</span>
                </button>
              )}

              {catDishes.map((dish) => {
                const displayName = dish.name_tr || dish.name_en || "İsimsiz";
                return (
                  <div
                    key={dish.id}
                    className="rounded-xl bg-card border border-border shadow-sm overflow-hidden relative group"
                  >
                    <div className="aspect-[4/3] bg-[hsl(var(--warm-beige))]">
                      {dish.image ? (
                        <img
                          src={dish.image}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{displayName}</span>
                      <span className="font-bold text-sm text-primary">{dish.price}₺</span>
                    </div>

                    <button
                      onClick={() => openEditDish(dish)}
                      className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Düzenle"
                    >
                      <Pencil className="h-3.5 w-3.5 text-foreground" />
                    </button>
                  </div>
                );
              })}

              {catDishes.length === 0 && (
                <div className="col-span-2 text-sm text-muted-foreground">
                  Bu kategoride henüz yemek yok.
                </div>
              )}
            </div>
          </div>
        ))}

        {activeCategoryId === null && (
          <div className="mt-6">
            <button
              onClick={openNewDish}
              className="w-full py-4 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Yeni yemek ekle</span>
            </button>
          </div>
        )}
      </div>

      <EditCategoriesModal
        open={showCategoriesModal}
        onOpenChange={setShowCategoriesModal}
        categories={categoriesForModal as any}
        onSave={handleSaveCategories as any}
      />

      <EditDishModal
        open={showDishModal}
        onOpenChange={setShowDishModal}
        dish={editingDish}
        onSave={handleSaveDish}
        onDelete={handleDeleteDish}
        categories={dishCategoryOptions}
      />
    </div>
  );
}