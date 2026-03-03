import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = {
  id: number;
  name_tr: string;
  name_en: string;
  is_system?: boolean;
  _deleted?: boolean;
  _new?: boolean;
};

interface EditCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: {
    id: number;
    name_tr?: string;
    name_en?: string;
    name?: string;
    is_system?: boolean;
  }[];
  onSave: (payload: {
    create: { name_tr: string; name_en: string }[];
    rename: { id: number; name_tr: string; name_en: string }[];
    delete: { id: number }[];
  }) => Promise<void> | void;
}

function isSystemCategoryLikeUnsorted(c: {
  name_tr?: string;
  name_en?: string;
  name?: string;
  is_system?: boolean;
}) {
  if (typeof c.is_system === "boolean") return c.is_system;

  const tr = (c.name_tr ?? "").trim().toLowerCase();
  const en = (c.name_en ?? "").trim().toLowerCase();
  const any = (c.name ?? "").trim().toLowerCase();

  return tr === "unsorted" || en === "unsorted" || any === "unsorted";
}

export function EditCategoriesModal({
  open,
  onOpenChange,
  categories,
  onSave,
}: EditCategoriesModalProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aSys = isSystemCategoryLikeUnsorted(a) ? 1 : 0;
      const bSys = isSystemCategoryLikeUnsorted(b) ? 1 : 0;

      if (aSys !== bSys) return aSys - bSys;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [categories]);

  useEffect(() => {
    if (!open) return;

    setRows(
      sortedCategories.map((c) => ({
        id: c.id,
        name_tr: c.name_tr ?? c.name ?? "",
        name_en: c.name_en ?? "",
        is_system: isSystemCategoryLikeUnsorted(c),
      }))
    );
  }, [open, sortedCategories]);

  const visibleRows = useMemo(() => {
    const v = rows.filter((r) => !r._deleted);

    return [...v].sort((a, b) => {
      const aNew = a._new || a.id < 0 ? 1 : 0;
      const bNew = b._new || b.id < 0 ? 1 : 0;
      if (aNew !== bNew) return aNew - bNew;

      const aSys = a.is_system ? 1 : 0;
      const bSys = b.is_system ? 1 : 0;
      if (aSys !== bSys) return aSys - bSys;

      return a.id - b.id;
    });
  }, [rows]);

  const updateField = (
    id: number,
    field: "name_tr" | "name_en",
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleAdd = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now() * -1,
        name_tr: "",
        name_en: "",
        is_system: false,
        _new: true,
      },
    ]);
  };

  const handleDelete = (id: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, _deleted: true } : r))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const create = rows
        .filter((r) => r._new && !r._deleted)
        .map((r) => ({
          name_tr: r.name_tr.trim(),
          name_en: r.name_en.trim(),
        }))
        .filter((x) => x.name_tr);

      const rename = rows
        .filter((r) => !r._new && !r._deleted)
        .map((r) => {
          const original = categories.find((c) => c.id === r.id);
          return {
            id: r.id,
            name_tr: r.name_tr.trim(),
            name_en: r.name_en.trim(),
            original_tr: (original?.name_tr ?? original?.name ?? "").trim(),
            original_en: (original?.name_en ?? "").trim(),
          };
        })
        .filter(
          (r) =>
            r.name_tr &&
            (r.name_tr !== r.original_tr || r.name_en !== r.original_en)
        )
        .map(({ id, name_tr, name_en }) => ({ id, name_tr, name_en }));

      const del = rows
        .filter((r) => !r._new && r._deleted)
        .map((r) => ({ id: r.id }));

      await onSave({ create, rename, delete: del });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = useMemo(() => {
    return visibleRows.every((r) => r.name_tr.trim().length > 0);
  }, [visibleRows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kategorileri Düzenle</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2 max-h-60 overflow-y-auto">
          {visibleRows.map((row) => (
            <div
              key={row.id}
              className="space-y-1 border p-2 rounded-lg"
              title={row.is_system ? "Sistem kategorisi" : undefined}
            >
              <Input
                placeholder="İsim (TR)"
                value={row.name_tr}
                onChange={(e) =>
                  updateField(row.id, "name_tr", e.target.value)
                }
              />
              <Input
                placeholder="İsim (EN)"
                value={row.name_en}
                onChange={(e) =>
                  updateField(row.id, "name_en", e.target.value)
                }
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className={`p-1 ${
                    row.is_system
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-destructive"
                  }`}
                  disabled={row.is_system}
                  title={
                    row.is_system
                      ? "Sistem kategorisi silinemez"
                      : "Sil"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={handleAdd}
          className="w-full mt-2"
        >
          <Plus className="h-4 w-4 mr-2" /> Kategori Ekle
        </Button>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !canSave}>
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}