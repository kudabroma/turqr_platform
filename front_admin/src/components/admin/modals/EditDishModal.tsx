import { useEffect, useMemo, useState, useRef } from "react";
import { Upload, Copy } from "lucide-react";
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

export interface DishData {
  id?: number;

  name_tr: string;
  name_en: string;

  description_tr: string;
  description_en: string;

  price: number;

  image: string;
  imageFile?: File | null;

  vegan: boolean;
  spicy: boolean;
  featured: boolean;

  _categoryId?: number;
  _categoryName?: string;
}

interface EditDishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: DishData | null;
  onSave: (dish: DishData) => void;
  onDelete?: (id: number) => void;
  categories?: { id: number; name: string; is_system?: boolean }[];
}

type Lang = "tr" | "en";

const emptyDish: DishData = {
  name_tr: "",
  name_en: "",
  description_tr: "",
  description_en: "",
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
  const [activeLang, setActiveLang] = useState<Lang>("tr");

  const isNew = !dish;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function acceptFile(file: File) {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!open) return;

    if (dish) {
      setForm({
        ...dish,
        name_tr: dish.name_tr ?? "",
        name_en: dish.name_en ?? "",
        description_tr: dish.description_tr ?? "",
        description_en: dish.description_en ?? "",
      });
    } else {
      setForm(emptyDish);
    }

    setActiveLang("tr");
    setImageFile(null);
    setImagePreview(null);
  }, [open, dish]);

  const categoryOptions = useMemo(() => {
    return (categories ?? []).filter((c: any) => !c?.is_system);
  }, [categories]);

  const update = <K extends keyof DishData>(key: K, value: DishData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const copyTrToEn = () => {
    setForm((prev) => ({
      ...prev,
      name_en: prev.name_en?.trim() ? prev.name_en : prev.name_tr,
      description_en: prev.description_en?.trim() ? prev.description_en : prev.description_tr,
    }));
    setActiveLang("en");
  };

  const handleSave = () => {
    if (!form.name_tr.trim()) {
      alert("Name (TR) is required.");
      setActiveLang("tr");
      return;
    }

    if (!form._categoryId) {
      alert("Select a category for this dish.");
      return;
    }

    onSave({ ...form, imageFile });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!form.id || !onDelete) return;
    onDelete(form.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isNew ? "Add New Dish" : "Edit Dish"}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-132px)]">
          <div className="space-y-4 mt-2">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) acceptFile(file);
                }}
              />

              <div
                className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) acceptFile(file);
                }}
                title="Click to upload"
              >
                {imagePreview || form.image ? (
                  <img
                    src={imagePreview || form.image}
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
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photo
              </Button>
            </div>

            {/* Language Tabs */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Translation</Label>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyTrToEn}
                  title="Copy TR to EN (fills empty EN fields)"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy TR → EN
                </Button>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setActiveLang("tr")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeLang === "tr"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  TR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeLang === "en"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  EN
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {activeLang === "tr" ? (
                  <>
                    <div>
                      <Label>Name (TR)</Label>
                      <Input
                        value={form.name_tr}
                        onChange={(e) => update("name_tr", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Description (TR)</Label>
                      <Textarea
                        value={form.description_tr}
                        onChange={(e) => update("description_tr", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Name (EN)</Label>
                      <Input
                        value={form.name_en}
                        onChange={(e) => update("name_en", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Description (EN)</Label>
                      <Textarea
                        value={form.description_en}
                        onChange={(e) => update("description_en", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Category */}
            {categoryOptions.length > 0 && (
              <div>
                <Label>Category</Label>
                <select
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
              </div>
            )}

            {/* Price */}
            <div>
              <Label>Price (₺)</Label>
              <Input
                type="number"
                step="0.01"
                value={Number.isFinite(form.price) ? form.price : 0}
                onChange={(e) => update("price", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-background sticky bottom-0 flex items-center justify-between">
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