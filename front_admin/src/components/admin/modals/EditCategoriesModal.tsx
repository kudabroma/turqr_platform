import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, GripVertical, Pencil } from "lucide-react";

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
import {
  EditCategoryTranslationModal,
  type CategoryDraft,
} from "@/components/admin/modals/EditCategoryTranslationModal";
import type { Category } from "@/api/endpoints";

type Row = {
  id: number;
  name_tr: string;
  name_en: string;
  name_ru: string;
  name_i18n?: Record<string, string>;
  is_system?: boolean;
  _deleted?: boolean;
};

interface EditCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  categories: {
    id: number;
    name_tr?: string;
    name_en?: string;
    name?: string;
    name_i18n?: Record<string, string>;
    is_system?: boolean;
  }[];

  /** Языки ресторана (из Restaurant.enabled_languages) — прокидывается в Уровень 2. */
  enabledLanguages?: string[];

  /**
   * Категории уже создаются/редактируются напрямую через Уровень 2 (AI ile
   * Çevir modalı) — сюда попадают только структурные изменения списка:
   * удаление и порядок (drag-reorder).
   */
  onSave: (payload: {
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
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
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
      <div className="flex gap-3 items-center">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center cursor-grab px-2 text-muted-foreground"
          title="Sürükle"
        >
          <GripVertical size={18} />
        </div>

        <div className="flex-1 min-w-0 h-12 rounded-xl bg-white border border-border text-base flex items-center px-4 truncate">
          {row.name_tr || <span className="text-muted-foreground">İsimsiz kategori</span>}
        </div>

        <button
          type="button"
          onClick={() => onEdit(row.id)}
          className="w-14 h-12 shrink-0 rounded-xl border border-gray-200 bg-white flex items-center justify-center transition-colors text-foreground hover:bg-gray-50"
          title="Düzenle"
        >
          <Pencil className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(row.id)}
          className="w-14 h-12 shrink-0 rounded-xl border border-gray-200 bg-white flex items-center justify-center transition-colors text-destructive hover:bg-red-50"
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
  enabledLanguages,
  onSave,
}: EditCategoriesModalProps) {
  const qc = useQueryClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // true только когда пользователь реально перетащил строку или пометил
  // удаление — то есть когда есть что сохранять через кнопку списка.
  const [structuralDirty, setStructuralDirty] = useState(false);

  // Уровень 2: модалка перевода категории. null = закрыта.
  const [editingRow, setEditingRow] = useState<CategoryDraft | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  // Держим последний проп в ref, чтобы эффект инициализации ниже мог читать
  // актуальные данные, но НЕ пересоздавать rows при каждом обновлении пропа.
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  // Инициализируем rows только при СВЕЖЕМ открытии модалки — не при каждом
  // изменении пропа categories. Иначе фоновый refetch, вызванный сохранением
  // на Уровне 2 (или просто refetchOnWindowFocus), молча перезаписывает ещё
  // не сохранённые локальные изменения (перетаскивание, пометки на удаление).
  useEffect(() => {
    if (!open) return;

    setRows(
      categoriesRef.current.map((c) => ({
        id: c.id,
        name_tr: sanitizeCategoryName(c.name_tr ?? c.name ?? ""),
        name_en: sanitizeCategoryName(c.name_en ?? ""),
        name_ru: sanitizeCategoryName((c as any).name_ru ?? ""),
        name_i18n: { ...(c.name_i18n ?? {}) },
        is_system: isSystemCategoryLikeUnsorted(c),
      }))
    );
    setEditingRow(null);
    setIsCreating(false);
    setStructuralDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const visibleRows = useMemo(
    () => rows.filter((r) => !r._deleted && !r.is_system),
    [rows]
  );

  const handleDelete = (id: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, _deleted: true } : r))
    );
    setStructuralDirty(true);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setRows((items) => arrayMove(items, oldIndex, newIndex));
    setStructuralDirty(true);
  }

  // Открыть Уровень 2 — редактирование существующей строки
  const openEdit = (id: number) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setIsCreating(false);
    setEditingRow(row);
  };

  // Открыть Уровень 2 — сразу в режиме создания, без добавления пустой строки в список
  const openCreate = () => {
    setIsCreating(true);
    setEditingRow({
      // id намеренно отсутствует — категория ещё не существует на бэке
      name_tr: "",
      name_en: "",
      name_ru: "",
      name_i18n: {},
    });
  };

  const closeLevel2 = () => {
    setEditingRow(null);
    setIsCreating(false);
  };

  // Уровень 2 уже сохранил категорию на бэке — просто отразить результат в списке
  const handleLevel2Save = (saved: Category) => {
    const newRow: Row = {
      id: saved.id,
      name_tr: saved.name_tr ?? saved.name ?? "",
      name_en: saved.name_en ?? "",
      name_ru: (saved as any).name_ru ?? "",
      name_i18n: { ...(saved.name_i18n ?? {}) },
      is_system: saved.is_system ?? false,
    };

    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [...prev, newRow];
      return prev.map((r, i) => (i === idx ? newRow : r));
    });

    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["menu"] });

    closeLevel2();
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const del = rows
        .filter((r) => r._deleted && !r.is_system)
        .map((r) => ({ id: r.id }));

      const reorder = rows
        .filter((r) => !r._deleted && !r.is_system)
        .map((r, index) => ({
          id: r.id,
          sort_order: index,
        }));

      await onSave({
        delete: del,
        reorder,
      });

      await qc.invalidateQueries({ queryKey: ["menu"] });
      await qc.invalidateQueries({ queryKey: ["categories"] });

      setStructuralDirty(false);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Единственное, что эта кнопка сохраняет — удаление и порядок (drag-reorder).
  // Название/переводы категорий уже сохранены напрямую через Уровень 2.
  const canSave = structuralDirty;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
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
                <div className="mt-2 max-h-[52vh] overflow-y-auto pr-1 space-y-3">
                  {visibleRows.map((row) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              onClick={openCreate}
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
                title="Sıralama ve silme değişikliklerini kaydeder — kategori isimleri zaten anında kaydedildi"
              >
                {isSaving ? "Kaydediliyor..." : "Liste Değişikliklerini Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditCategoryTranslationModal
        open={editingRow !== null}
        onOpenChange={(o) => {
          if (!o) closeLevel2();
        }}
        category={editingRow}
        isNew={isCreating}
        enabledLanguages={enabledLanguages}
        onSave={handleLevel2Save}
      />
    </>
  );
}
