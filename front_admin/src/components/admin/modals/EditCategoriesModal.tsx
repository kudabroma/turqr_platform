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
  name: string;
  // пометки для черновика
  _deleted?: boolean;
  _new?: boolean;
};

interface EditCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // IMPORTANT: лучше передавать объекты, а не string[]
  // но если пока не хочешь — ниже покажу как адаптировать.
  categories: { id: number; name: string }[];

  onSave: (payload: {
    create: { name: string }[];
    rename: { id: number; name: string }[];
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

  // ✅ каждый раз при открытии — делаем свежий черновик
  useEffect(() => {
    if (!open) return;
    setRows(categories.map((c) => ({ id: c.id, name: c.name })));
  }, [open, categories]);

  const visibleRows = useMemo(
    () => rows.filter((r) => !r._deleted),
    [rows]
  );

  const handleRename = (id: number, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: value } : r))
    );
  };

  const handleAdd = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now() * -1, name: "New Category", _new: true },
    ]);
  };

  const handleDelete = (id: number) => {
    // ✅ удаляем только в черновике
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, _deleted: true } : r))
    );
  };

  const handleCancel = () => {
    // ✅ просто закрываем. Черновик при следующем open пересоздастся из props
    onOpenChange(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const create = rows
        .filter((r) => r._new && !r._deleted)
        .map((r) => ({ name: r.name.trim() }))
        .filter((x) => x.name);

      const rename = rows
        .filter((r) => !r._new && !r._deleted)
        .map((r) => {
          const original = categories.find((c) => c.id === r.id);
          return { id: r.id, name: r.name.trim(), originalName: original?.name ?? "" };
        })
        .filter((r) => r.name && r.name !== r.originalName)
        .map(({ id, name }) => ({ id, name }));

      const del = rows
        .filter((r) => !r._new && r._deleted)
        .map((r) => ({ id: r.id }));

      await onSave({ create, rename, delete: del });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = visibleRows.every((r) => r.name.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
          {visibleRows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <Input
                value={row.name}
                onChange={(e) => handleRename(row.id, e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => handleDelete(row.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                aria-label="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={handleAdd} className="w-full mt-2">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}