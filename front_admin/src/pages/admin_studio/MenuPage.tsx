import { useState } from "react";
import { Search, Pencil, Plus, Settings } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EditCategoriesModal } from "@/components/admin/modals/EditCategoriesModal";
import { EditDishModal, type DishData } from "@/components/admin/modals/EditDishModal";

const initialCategories = ["kebab", "salad", "deserts"];

const initialDishes: DishData[] = [
  { id: 1, name: "iskender kebab", description: "Traditional Turkish kebab", price: 1500, image: "", vegan: false, spicy: false, featured: true },
  { id: 2, name: "adana kebab", description: "Spicy minced meat kebab", price: 1200, image: "", vegan: false, spicy: true, featured: false },
  { id: 3, name: "greek salad", description: "Fresh vegetables with feta", price: 150, image: "", vegan: true, spicy: false, featured: true },
  { id: 4, name: "baklava", description: "Sweet pastry with nuts", price: 150, image: "", vegan: false, spicy: false, featured: true },
];

export default function MenuPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dishes, setDishes] = useState(initialDishes);
  const [search, setSearch] = useState("");
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingDish, setEditingDish] = useState<DishData | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);

  // Simple category assignment: kebab dishes contain "kebab", etc.
  const getCategoryForDish = (dish: DishData) => {
    const name = dish.name.toLowerCase();
    if (name.includes("kebab")) return "kebab";
    if (name.includes("salad")) return "salad";
    return "deserts";
  };

  const filteredDishes = dishes.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || getCategoryForDish(d) === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category when showing "All"
  const groupedByCategory = !activeCategory
    ? categories.map((cat) => ({
        category: cat,
        dishes: filteredDishes.filter((d) => getCategoryForDish(d) === cat),
      }))
    : [{ category: activeCategory, dishes: filteredDishes }];

  const handleSaveDish = (dish: DishData) => {
    setDishes((prev) => {
      const exists = prev.find((d) => d.id === dish.id);
      if (exists) return prev.map((d) => (d.id === dish.id ? dish : d));
      return [...prev, dish];
    });
  };

  const handleDeleteDish = (id: number) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
  };

  const openNewDish = () => {
    setEditingDish(null);
    setShowDishModal(true);
  };

  const openEditDish = (dish: DishData) => {
    setEditingDish(dish);
    setShowDishModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="TurkoKebabHouse" showBack />

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
              {/* Add new dish tile (first in each group when category is selected) */}
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
                    {dish.image && (
                      <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{dish.name}</span>
                    <span className="font-bold text-sm text-primary">{dish.price}₺</span>
                  </div>
                  {/* Edit button */}
                  <button
                    onClick={() => openEditDish(dish)}
                    className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3.5 w-3.5 text-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Add new dish at top level when no category selected */}
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

      <EditCategoriesModal
        open={showCategoriesModal}
        onOpenChange={setShowCategoriesModal}
        categories={categories}
        onSave={setCategories}
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
