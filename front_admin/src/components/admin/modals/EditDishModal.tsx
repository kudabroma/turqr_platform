import { useEffect, useMemo, useState, useRef } from "react";
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

export interface DishData {
  id?: number;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  is_active: boolean;
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
  is_active: true,
  price: 0,
  image: "",
  vegan: false,
  spicy: false,
  featured: false,
  _categoryId: undefined,
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

  const [nameTrError, setNameTrError] = useState("");
  const [categoryError, setCategoryError] = useState("");

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
        is_active: (dish as any).is_active ?? true,
        _categoryId: dish._categoryId ?? undefined,
      });
    } else {
      setForm(emptyDish);
    }

    setActiveLang("tr");
    setImageFile(null);
    setImagePreview(null);

    // сброс ошибок при открытии
    setNameTrError("");
    setCategoryError("");
  }, [open, dish]);

  const categoryOptions = useMemo(() => {
    return (categories ?? []).filter((c: any) => !c?.is_system);
  }, [categories]);

  const update = <K extends keyof DishData>(key: K, value: DishData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "name_tr" && String(value).trim()) {
      setNameTrError("");
    }

    if (key === "_categoryId" && value) {
      setCategoryError("");
    }
  };

  const handleSave = () => {
    let hasError = false;

    if (!form.name_tr.trim()) {
      setNameTrError("İsim (TR) zorunludur.");
      setActiveLang("tr");
      hasError = true;
    } else {
      setNameTrError("");
    }

    if (!form._categoryId) {
      setCategoryError("Kategori seçmelisiniz.");
      hasError = true;
    } else {
      setCategoryError("");
    }

    if (hasError) return;

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
          <DialogTitle>{isNew ? "Yeni Yemek Ekle" : "Yemeği Düzenle"}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-132px)]">
          <div className="space-y-4 mt-2">
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
                Fotoğraf Yükle
              </Button>
            </div>

            <div>
              <Label>Çeviri</Label>

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
                      <Label>İsim (TR)</Label>
                      <Input
                        value={form.name_tr}
                        onChange={(e) => update("name_tr", e.target.value)}
                        className={nameTrError ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {nameTrError ? (
                        <p className="mt-2 text-sm text-red-500">{nameTrError}</p>
                      ) : null}
                    </div>

                    <div>
                      <Label>Açıklama (TR)</Label>
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
                      <Label>İsim (EN)</Label>
                      <Input
                        value={form.name_en}
                        onChange={(e) => update("name_en", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Açıklama (EN)</Label>
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

            {categoryOptions.length > 0 && (
              <div>
                <Label>Kategori</Label>
                <select
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${
                    categoryError ? "border-red-500" : "border-border"
                  }`}
                  value={form._categoryId ?? ""}
                  onChange={(e) =>
                    update(
                      "_categoryId",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                >
                  <option value="">
                    Kategori seçiniz...
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {categoryError ? (
                  <p className="mt-2 text-sm text-red-500">{categoryError}</p>
                ) : null}
              </div>
            )}

            {categoryOptions.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-900">
                  Önce kategori oluşturmalısınız.
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Yemek eklemek için en az bir kategori gerekli.
                </p>
              </div>
            )}

            <div>
              <Label>Fiyat (₺)</Label>
              <Input
                type="number"
                step="0.01"
                value={Number.isFinite(form.price) ? form.price : 0}
                onChange={(e) => update("price", Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div>
                <div className="font-medium text-sm">Durum</div>
                <div className="text-xs text-muted-foreground">
                  {form.is_active
                    ? "Yemek aktif ve menüde görünür"
                    : "Yemek pasif ve gizlidir"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => update("is_active", !form.is_active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  form.is_active ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    form.is_active ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-1 border-t bg-background flex items-center justify-between">
          <div>
            {!isNew && onDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Sil
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}