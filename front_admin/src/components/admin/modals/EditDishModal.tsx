import { useState, useEffect } from "react";
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
  id?: number; // теперь id может быть undefined для нового блюда
  name: string;
  description: string;
  price: number;
  image: string;
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
}: EditDishModalProps) {
  const [form, setForm] = useState<DishData>(emptyDish);

  const isNew = !dish;

  // ✅ СИНХРОНИЗАЦИЯ ФОРМЫ ПРИ ОТКРЫТИИ
  useEffect(() => {
    if (open) {
      if (dish) {
        setForm(dish);
      } else {
        setForm(emptyDish);
      }
    }
  }, [open, dish]);

  const update = <K extends keyof DishData>(key: K, value: DishData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;

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
                <img src={form.image} alt="" className="w-full h-full object-cover" />
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
                  <Checkbox checked={form.vegan} onCheckedChange={(v) => update("vegan", !!v)} />
                  Vegan
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.spicy} onCheckedChange={(v) => update("spicy", !!v)} />
                  Spicy
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.featured} onCheckedChange={(v) => update("featured", !!v)} />
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