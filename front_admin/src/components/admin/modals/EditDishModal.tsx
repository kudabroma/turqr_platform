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
  name_ru: string;
  description_ru: string;
  is_active: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_spicy: boolean;
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

type Lang = "tr" | "en" | "ru";

const FIELD_LIMITS = {
  name: 100,
  description: 500,
} as const;

const DISH_NAME_REGEX = /[^\p{L}\p{N}\s&.,'"()\-\/+]/gu;
const DISH_DESCRIPTION_REGEX = /[^\p{L}\p{N}\s&.,'"()\-\/+!?:%]/gu;

function sanitizeDishName(value: string): string {
  return value
    .replace(DISH_NAME_REGEX, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, FIELD_LIMITS.name);
}

function sanitizeDishDescription(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(DISH_DESCRIPTION_REGEX, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart()
    .slice(0, FIELD_LIMITS.description);
}

const emptyDish: DishData = {
  name_tr: "",
  name_en: "",
  description_tr: "",
  description_en: "",
  name_ru: "",
  description_ru: "",
  is_active: true,
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
  is_spicy: false,
  price: 0,
  image: "",
  vegan: false,
  spicy: false,
  featured: false,
  _categoryId: undefined,
};

const DIET_LABELS = [
  { key: "is_vegan" as keyof DishData, emoji: "🌱", label: "Vegan" },
  { key: "is_vegetarian" as keyof DishData, emoji: "🥗", label: "Vejetaryen" },
  { key: "is_spicy" as keyof DishData, emoji: "🌶️", label: "Acılı" },
  { key: "is_gluten_free" as keyof DishData, emoji: "🌾", label: "Glutensiz" },
];

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

  const [priceInput, setPriceInput] = useState<string>("0");

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
        name_tr: sanitizeDishName(dish.name_tr ?? ""),
        name_en: sanitizeDishName(dish.name_en ?? ""),
        description_tr: sanitizeDishDescription(dish.description_tr ?? ""),
        description_en: sanitizeDishDescription(dish.description_en ?? ""),
        name_ru: sanitizeDishName((dish as any).name_ru ?? ""),
        description_ru: sanitizeDishDescription((dish as any).description_ru ?? ""),
        is_active: (dish as any).is_active ?? true,
        is_vegetarian: (dish as any).is_vegetarian ?? false,
        is_vegan: (dish as any).is_vegan ?? false,
        is_gluten_free: (dish as any).is_gluten_free ?? false,
        is_spicy: (dish as any).is_spicy ?? false,
        _categoryId: dish._categoryId ?? undefined,
      });
      setPriceInput(String(dish.price ?? 0));
    } else {
      setForm(emptyDish);
      setPriceInput("0");
    }

    setActiveLang("tr");
    setImageFile(null);
    setImagePreview(null);
    setNameTrError("");
    setCategoryError("");
  }, [open, dish]);

  const categoryOptions = useMemo(() => {
    return (categories ?? []).filter((c: any) => !c?.is_system);
  }, [categories]);

  const update = <K extends keyof DishData>(key: K, value: DishData[K]) => {
    let nextValue = value;

    if (typeof value === "string") {
      if (key === "name_tr" || key === "name_en" || key === "name_ru") {
        nextValue = sanitizeDishName(value) as DishData[K];
      }
      if (key === "description_tr" || key === "description_en" || key === "description_ru") {
        nextValue = sanitizeDishDescription(value) as DishData[K];
      }
    }

    setForm((prev) => ({ ...prev, [key]: nextValue }));

    if (key === "name_tr" && String(nextValue).trim()) setNameTrError("");
    if (key === "_categoryId" && nextValue) setCategoryError("");
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

            {/* Фото */}
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
                  <img src={imagePreview || form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Fotoğraf Yükle
              </Button>
            </div>

            {/* Переводы TR / EN / RU */}
            <div>
              <Label>Çeviri</Label>
              <div className="flex gap-2 mt-2">
                {(["tr", "en", "ru"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setActiveLang(l)}
                    className={`px-3 py-1 rounded-full text-sm uppercase ${
                      activeLang === l ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="mt-3 space-y-3">
                {activeLang === "tr" && (
                  <>
                    <div>
                      <Label>İsim (TR)</Label>
                      <Input
                        value={form.name_tr}
                        maxLength={FIELD_LIMITS.name}
                        onChange={(e) => update("name_tr", e.target.value)}
                        className={nameTrError ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {nameTrError && <p className="mt-2 text-sm text-red-500">{nameTrError}</p>}
                    </div>
                    <div>
                      <Label>Açıklama (TR)</Label>
                      <Textarea
                        value={form.description_tr}
                        maxLength={FIELD_LIMITS.description}
                        onChange={(e) => update("description_tr", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {activeLang === "en" && (
                  <>
                    <div>
                      <Label>İsim (EN)</Label>
                      <Input
                        value={form.name_en}
                        maxLength={FIELD_LIMITS.name}
                        onChange={(e) => update("name_en", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Açıklama (EN)</Label>
                      <Textarea
                        value={form.description_en}
                        maxLength={FIELD_LIMITS.description}
                        onChange={(e) => update("description_en", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {activeLang === "ru" && (
                  <>
                    <div>
                      <Label>İsim (RU)</Label>
                      <Input
                        value={form.name_ru}
                        maxLength={FIELD_LIMITS.name}
                        onChange={(e) => update("name_ru", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Açıklama (RU)</Label>
                      <Textarea
                        value={form.description_ru}
                        maxLength={FIELD_LIMITS.description}
                        onChange={(e) => update("description_ru", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Категория */}
            {categoryOptions.length > 0 && (
              <div>
                <Label>Kategori</Label>
                <select
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${categoryError ? "border-red-500" : "border-border"}`}
                  value={form._categoryId ?? ""}
                  onChange={(e) => update("_categoryId", e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Kategori seçiniz...</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {categoryError && <p className="mt-2 text-sm text-red-500">{categoryError}</p>}
              </div>
            )}

            {categoryOptions.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-900">Önce kategori oluşturmalısınız.</p>
                <p className="mt-1 text-sm text-amber-800">Yemek eklemek için en az bir kategori gerekli.</p>
              </div>
            )}

            {/* Цена */}
            <div>
              <Label>Fiyat (₺)</Label>
              <Input
                type="number"
                min={0}
                step={50}
                value={priceInput}
                onFocus={() => { if (priceInput === "0") setPriceInput(""); }}
                onBlur={() => {
                  if (priceInput === "" || isNaN(Number(priceInput))) {
                    setPriceInput("0");
                    update("price", 0);
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    setPriceInput(val);
                    update("price", val === "" ? 0 : Number(val));
                  }
                }}
              />
            </div>

            {/* Диетические метки */}
            <div className="border rounded-xl px-4 py-3 space-y-3">
              <div className="font-medium text-sm">Diyet Etiketleri</div>
              {DIET_LABELS.map(({ key, emoji, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {emoji} {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => update(key, !form[key] as any)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      form[key] ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        form[key] ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Статус активности */}
            <div className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div>
                <div className="font-medium text-sm">Durum</div>
                <div className="text-xs text-muted-foreground">
                  {form.is_active ? "Yemek aktif ve menüde görünür" : "Yemek pasif ve gizlidir"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => update("is_active", !form.is_active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_active ? "translate-x-5" : ""}`}
                />
              </button>
            </div>

          </div>
        </div>

        <div className="px-6 py-1 border-t bg-background flex items-center justify-between">
          <div>
            {!isNew && onDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>Sil</Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}