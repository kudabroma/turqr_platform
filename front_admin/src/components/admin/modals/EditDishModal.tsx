import { useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export interface DishData {
  id?: number; // undefined для нового блюда
  name: string;
  description: string;
  price: number;
  image: string;

  // (пока не используем, скрыты)
  vegan: boolean;
  spicy: boolean;
  featured: boolean;

  // ✅ UI-only
  _categoryId?: number;
  _categoryName?: string;
}

interface EditDishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: DishData | null;
  onSave: (dish: DishData) => void;
  onDelete?: (id: number) => void;

  // ✅ список категорий для "Move to category" внутри модалки
  categories?: { id: number; name: string }[];
}

const emptyDish: DishData = {
  name: "",
  description: "",
  price: 0,
  image: "",
  vegan: false,
  spicy: false,
  featured: false,
};

export function EditDishModal({
  open,
  onOpenChange,
  dish,
  onSave,
  onDelete,
  categories,
}: EditDishModalProps) {
  const [form, setForm] = useState<DishData>(emptyDish);

  const isNew = !dish;

  // ✅ синхронизируем форму при открытии/смене dish
  useEffect(() => {
    if (!open) return;

    if (dish) {
      setForm(dish);
    } else {
      setForm(emptyDish);
    }
  }, [open, dish]);

  // ✅ для селекта: категории без Unsorted, если ты уже исключаешь is_system в MenuPage — ок,
  // но тут ещё раз подстрахуемся (если вдруг прилетит)
  const categoryOptions = useMemo(() => {
    return (categories ?? []).filter((c: any) => !c?.is_system);
  }, [categories]);

  const update = <K extends keyof DishData>(key: K, value: DishData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;

    // ✅ category обязателен для сохранения (в MenuPage ты ещё раз проверяешь)
    if (!form._categoryId) {
      alert("Select a category for this dish.");
      return;
    }

    onSave(form);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!form.id || !onDelete) return;
    onDelete(form.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add New Dish" : "Edit Dish"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {form.image ? (
                <img
                  src={form.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                update("image", `https://picsum.photos/200?random=${Date.now()}`)
              }
            >
              Upload Photo
            </Button>
          </div>

          <div>
            <Label htmlFor="dish-name">Name</Label>
            <Input
              id="dish-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dish-desc">Description</Label>
            <Textarea
              id="dish-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={2}
            />
          </div>

          {/* ✅ Move to category (внутри модалки, под описанием) */}
          {categoryOptions.length > 0 ? (
            <div>
              <Label htmlFor="dish-category">Category</Label>
              <select
                id="dish-category"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={form._categoryId ?? ""}
                onChange={(e) =>
                  update(
                    "_categoryId",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
              >
                <option value="" disabled>
                  Select category…
                </option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted-foreground mt-1">
                This moves the dish into the selected category.
              </div>
            </div>
          ) : null}

          <div>
            <Label htmlFor="dish-price">Price (₺)</Label>
            <Input
              id="dish-price"
              type="number"
              value={form.price}
              onChange={(e) => update("price", Number(e.target.value))}
            />
          </div>

          {/* Checkboxes (disabled for now — backend fields not implemented yet) */}
          {false && (
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.vegan}
                  onCheckedChange={(v) => update("vegan", !!v)}
                />
                Vegan
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.spicy}
                  onCheckedChange={(v) => update("spicy", !!v)}
                />
                Spicy
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.featured}
                  onCheckedChange={(v) => update("featured", !!v)}
                />
                Featured
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            {!isNew && onDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}