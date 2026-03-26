import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical } from "lucide-react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

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
    reorder: { id: number; sort_order: number }[];
  }) => Promise<void> | void;
}

const CATEGORY_NAME_MAX = 100;
const CATEGORY_NAME_REGEX = /[^\p{L}\p{N}\s&.,'"()\-\/]/gu;

function sanitizeCategoryName(value: string): string {
  return value
    .replace(CATEGORY_NAME_REGEX, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, CATEGORY_NAME_MAX);
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

function SortableRow({
  row,
  updateField,
  handleDelete,
}: {
  row: Row;
  updateField: (id: number, field: "name_tr" | "name_en", value: string) => void;
  handleDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: row.id,
      disabled: false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-gray-200 bg-gray-100 p-3"
    >
      <div className="flex gap-3 items-stretch">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center cursor-grab px-2 text-muted-foreground"
          title="Sürükle"
        >
          <GripVertical size={18} />
        </div>

        <div className="flex-1 space-y-3">
          <Input
            placeholder="İsim (TR)"
            value={row.name_tr}
            maxLength={CATEGORY_NAME_MAX}
            onChange={(e) => updateField(row.id, "name_tr", e.target.value)}
            className="h-12 rounded-xl bg-white border-border text-base"
          />

          <Input
            placeholder="İsim (EN)"
            value={row.name_en}
            maxLength={CATEGORY_NAME_MAX}
            onChange={(e) => updateField(row.id, "name_en", e.target.value)}
            className="h-12 rounded-xl bg-white border-border text-base"
          />
        </div>

        <button
          type="button"
          onClick={() => handleDelete(row.id)}
          className="w-14 shrink-0 rounded-xl border border-gray-200 bg-white flex items-center justify-center transition-colors text-destructive hover:bg-red-50"
          title="Sil"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function EditCategoriesModal({
  open,
  onOpenChange,
  categories,
  onSave,
}: EditCategoriesModalProps) {
  const qc = useQueryClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!open) return;

    setRows(
      categories.map((c) => ({
        id: c.id,
        name_tr: sanitizeCategoryName(c.name_tr ?? c.name ?? ""),
        name_en: sanitizeCategoryName(c.name_en ?? ""),
        is_system: isSystemCategoryLikeUnsorted(c),
      }))
    );
  }, [open, categories]);

  const visibleRows = useMemo(
    () => rows.filter((r) => !r._deleted && !r.is_system),
    [rows]
  );

  const updateField = (
    id: number,
    field: "name_tr" | "name_en",
    value: string
  ) => {
    const sanitizedValue = sanitizeCategoryName(value);

    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: sanitizedValue } : r))
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setRows((items) => arrayMove(items, oldIndex, newIndex));
  }

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const create = rows
        .filter((r) => r._new && !r._deleted && !r.is_system)
        .map((r) => ({
          name_tr: r.name_tr.trim(),
          name_en: r.name_en.trim(),
        }))
        .filter((x) => x.name_tr);

      const rename = rows
        .filter((r) => !r._new && !r._deleted && !r.is_system)
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
        .filter((r) => !r._new && r._deleted && !r.is_system)
        .map((r) => ({ id: r.id }));

      const reorder = rows
        .filter((r) => !r._new && !r._deleted && !r.is_system)
        .map((r, index) => ({
          id: r.id,
          sort_order: index,
        }));

      await onSave({
        create,
        rename,
        delete: del,
        reorder,
      });

      await qc.invalidateQueries({ queryKey: ["menu"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });

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
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-semibold">
            Kategorileri Düzenle
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleRows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="mt-2 max-h-[52vh] overflow-y-auto pr-1 space-y-4">
                {visibleRows.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    updateField={updateField}
                    handleDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            onClick={handleAdd}
            className="w-full mt-5 h-12 rounded-xl text-lg font-medium bg-orange-500 hover:bg-orange-600 text-white border-0"
          >
            <Plus className="h-5 w-5 mr-2" />
            Kategori Ekle
          </Button>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-11 px-6 rounded-xl text-base"
            >
              İptal
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || !canSave}
              className="h-11 px-6 rounded-xl text-base"
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}