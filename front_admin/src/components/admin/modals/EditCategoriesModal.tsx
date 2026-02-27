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
  _deleted?: boolean;
  _new?: boolean;
};

interface EditCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  categories: { id: number; name_tr?: string; name_en?: string; name?: string }[];

  onSave: (payload: {
    create: { name_tr: string; name_en: string }[];
    rename: { id: number; name_tr: string; name_en: string }[];
    delete: { id: number }[];
  }) => Promise<void> | void;
}

export function EditCategoriesModal({
  open,
  onOpenChange,
  categories,
  onSave,
}: EditCategoriesModalProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setRows(
      categories.map((c) => ({
        id: c.id,
        name_tr: c.name_tr ?? c.name ?? "",
        name_en: c.name_en ?? "",
      }))
    );
  }, [open, categories]);

  const visibleRows = useMemo(
    () => rows.filter((r) => !r._deleted),
    [rows]
  );

  const updateField = (id: number, field: "name_tr" | "name_en", value: string) => {
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
            original_tr: original?.name_tr ?? original?.name ?? "",
            original_en: original?.name_en ?? "",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2 max-h-60 overflow-y-auto">
          {visibleRows.map((row) => (
            <div key={row.id} className="space-y-1 border p-2 rounded-lg">
              <Input
                placeholder="Name (TR)"
                value={row.name_tr}
                onChange={(e) => updateField(row.id, "name_tr", e.target.value)}
              />
              <Input
                placeholder="Name (EN)"
                value={row.name_en}
                onChange={(e) => updateField(row.id, "name_en", e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className="p-1 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={handleAdd} className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}