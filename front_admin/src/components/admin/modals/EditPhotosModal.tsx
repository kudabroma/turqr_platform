import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { restaurantApi } from "@/api/endpoints";

interface EditPhotosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SlotId = 1 | 2 | 3 | 4 | 5 | 6;

interface PhotoSlot {
  id: SlotId;
  url: string | null;
  file: File | null;
  removed: boolean;
}

const makeEmptySlots = (): PhotoSlot[] => [
  { id: 1, url: null, file: null, removed: false },
  { id: 2, url: null, file: null, removed: false },
  { id: 3, url: null, file: null, removed: false },
  { id: 4, url: null, file: null, removed: false },
  { id: 5, url: null, file: null, removed: false },
  { id: 6, url: null, file: null, removed: false },
];

function slotKey(id: SlotId) {
  return `photo${id}` as const;
}
function slotUrlKey(id: SlotId) {
  return `photo${id}_url` as const;
}

export function EditPhotosModal({ open, onOpenChange }: EditPhotosModalProps) {
  const queryClient = useQueryClient();

  const [slots, setSlots] = useState<PhotoSlot[]>(makeEmptySlots);
  const [saving, setSaving] = useState(false);

  const [activeSlotId, setActiveSlotId] = useState<SlotId | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // ✅ Берём данные из React Query кэша — не делаем лишний запрос
  const { data: restaurantData, isLoading } = useQuery({
    queryKey: ["restaurant", "me"],
    queryFn: restaurantApi.me,
    enabled: open,       // запрос только когда модалка открыта
    staleTime: Infinity, // берёт из кэша если уже есть — новый запрос не делает
  });

  // Заполняем слоты когда данные пришли из кэша или с сервера
  useEffect(() => {
    if (!open || !restaurantData) return;

    const next = makeEmptySlots().map((slot) => {
      const k = slotUrlKey(slot.id);
      const url = (restaurantData as any)?.[k] ?? null;
      return { ...slot, url, file: null, removed: false };
    });

    setSlots(next);
  }, [open, restaurantData]);

  // Сброс слотов при закрытии
  useEffect(() => {
    if (!open) {
      setActiveSlotId(null);
      setSlots(makeEmptySlots());
    }
  }, [open]);

  // Cleanup object URLs при анмаунте
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current.clear();
    };
  }, []);

  const anyChanges = useMemo(() => {
    return slots.some((s) => s.file !== null || s.removed === true);
  }, [slots]);

  const openPickerFor = (id: SlotId) => {
    setActiveSlotId(id);
    fileInputRef.current?.click();
  };

  const handleFilePicked = (file: File) => {
    if (!activeSlotId) return;

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(previewUrl);

    setSlots((prev) =>
      prev.map((s) =>
        s.id === activeSlotId
          ? { ...s, file, url: previewUrl, removed: false }
          : s
      )
    );
  };

  const handleRemove = (id: SlotId) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, url: null, file: null, removed: true }
          : s
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();

      slots.forEach((s) => {
        const key = slotKey(s.id);
        if (s.file) {
          fd.append(key, s.file);
          return;
        }
        if (s.removed) {
          fd.append(key, "");
        }
      });

      await restaurantApi.updateForm(fd);

      // ✅ Инвалидируем кэш — PhotoCarousel и PreviewPage обновятся сами
      await queryClient.invalidateQueries({ queryKey: ["restaurant", "me"] });

      // Cleanup preview object URLs
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      objectUrlsRef.current.clear();

      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const close = (val: boolean) => {
    if (!val) setActiveSlotId(null);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fotoğrafları Düzenle</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (file) handleFilePicked(file);
          }}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Fotoğraflar yükleniyor...</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mt-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted relative overflow-hidden flex items-center justify-center"
              >
                {slot.url ? (
                  <>
                    <img
                      src={slot.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-foreground/0 hover:bg-foreground/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openPickerFor(slot.id)}
                        className="bg-background/90 rounded-full p-1.5"
                        aria-label={`Upload photo ${slot.id}`}
                      >
                        <Upload className="h-3.5 w-3.5 text-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(slot.id)}
                        className="bg-destructive/90 rounded-full p-1.5"
                        aria-label={`Remove photo ${slot.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive-foreground" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openPickerFor(slot.id)}
                    className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Fotoğraf yükle</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => close(false)} disabled={saving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={saving || isLoading || !anyChanges}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor...
              </span>
            ) : (
              "Kaydet"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}