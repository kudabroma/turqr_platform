import { useEffect, useMemo, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { categoriesApi, type Category } from "@/api/endpoints";
import { ApiError } from "@/api/apiClient";

export interface CategoryDraft {
  id?: number;
  name_tr: string;
  name_en: string;
  name_ru: string;
  // переводы для языков без отдельных flat-полей (de, no, da, sv, fi, ...)
  name_i18n?: Record<string, string>;
}

interface EditCategoryTranslationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryDraft | null;
  /** true = "Kategori Ekle" (создание), false = редактирование существующей. */
  isNew: boolean;
  /** Языки ресторана (из Restaurant.enabled_languages). tr всегда первый. */
  enabledLanguages?: string[];
  /** Вызывается ПОСЛЕ успешного сохранения на бэке — с реальным объектом из ответа API. */
  onSave: (saved: Category) => void;
}

type Lang = string;
const DEFAULT_LANGS: Lang[] = ["tr", "en", "ru"];
const AI_NAME_HINT = "AI çevirisini kontrol edin, gerekirse düzenleyin.";

const NAME_MAX = 100;
const NAME_REGEX = /[^\p{L}\p{N}\s&.,'"()\-\/]/gu;

function sanitizeCategoryName(value: string): string {
  return value
    .replace(NAME_REGEX, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, NAME_MAX);
}

const emptyDraft: CategoryDraft = {
  name_tr: "",
  name_en: "",
  name_ru: "",
  name_i18n: {},
};

export function EditCategoryTranslationModal({
  open,
  onOpenChange,
  category,
  isNew,
  enabledLanguages,
  onSave,
}: EditCategoryTranslationModalProps) {
  const { toast } = useToast();

  const [form, setForm] = useState<CategoryDraft>(emptyDraft);
  const [activeLang, setActiveLang] = useState<Lang>("tr");
  const [nameTrError, setNameTrError] = useState("");
  const [translating, setTranslating] = useState(false);
  const [confirmTranslateOpen, setConfirmTranslateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // tr всегда первый и всегда присутствует
  const langs = useMemo<Lang[]>(() => {
    const base = enabledLanguages && enabledLanguages.length > 0 ? enabledLanguages : DEFAULT_LANGS;
    const uniq = Array.from(new Set(base));
    return uniq.includes("tr") ? ["tr", ...uniq.filter((l) => l !== "tr")] : ["tr", ...uniq];
  }, [enabledLanguages]);

  const translatableLangs = useMemo(() => langs.filter((l) => l !== "tr"), [langs]);

  useEffect(() => {
    if (!open) return;

    if (category) {
      setForm({
        ...category,
        name_tr: sanitizeCategoryName(category.name_tr ?? ""),
        name_en: sanitizeCategoryName(category.name_en ?? ""),
        name_ru: sanitizeCategoryName(category.name_ru ?? ""),
        name_i18n: { ...(category.name_i18n ?? {}) },
      });
    } else {
      setForm(emptyDraft);
    }

    setActiveLang("tr");
    setNameTrError("");
    setTranslating(false);
    setConfirmTranslateOpen(false);
    setSaving(false);
  }, [open, category]);

  const update = (field: "name_tr" | "name_en" | "name_ru", value: string) => {
    const sanitized = sanitizeCategoryName(value);
    setForm((prev) => ({ ...prev, [field]: sanitized }));
    if (field === "name_tr" && sanitized.trim()) setNameTrError("");
  };

  const updateI18nName = (lang: string, value: string) => {
    const sanitized = sanitizeCategoryName(value);
    setForm((prev) => ({
      ...prev,
      name_i18n: { ...(prev.name_i18n ?? {}), [lang]: sanitized },
    }));
  };

  const runTranslate = async () => {
    setConfirmTranslateOpen(false);

    if (!form.name_tr.trim() || translatableLangs.length === 0) return;

    setTranslating(true);
    try {
      const res = await categoriesApi.translate(form.name_tr.trim(), translatableLangs);

      setForm((prev) => {
        const nextI18n = { ...(prev.name_i18n ?? {}) };
        let next_en = prev.name_en;
        let next_ru = prev.name_ru;

        for (const [lang, name] of Object.entries(res.translations)) {
          const sanitized = sanitizeCategoryName(name ?? "");
          if (lang === "en") next_en = sanitized;
          else if (lang === "ru") next_ru = sanitized;
          else nextI18n[lang] = sanitized;
        }

        return { ...prev, name_en: next_en, name_ru: next_ru, name_i18n: nextI18n };
      });

      toast({
        title: "Çeviri tamamlandı",
        description: "İsimleri kontrol edip Kaydet'e basın.",
      });
    } catch (e) {
      const message =
        e instanceof ApiError
          ? (e.data as any)?.detail || e.message
          : "Çeviri sırasında hata oluştu.";

      toast({
        title: "Çeviri başarısız",
        description: message,
        variant: "destructive",
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!form.name_tr.trim()) {
      setNameTrError("İsim (TR) zorunludur.");
      setActiveLang("tr");
      return;
    }

    const payload = {
      name_tr: form.name_tr.trim(),
      name_en: form.name_en.trim(),
      name_ru: form.name_ru.trim(),
      name_i18n: form.name_i18n ?? {},
    };

    setSaving(true);
    try {
      const saved = isNew
        ? await categoriesApi.create(payload as any)
        : await categoriesApi.update(form.id as number, payload as any);

      toast({
        title: isNew ? "Kategori oluşturuldu" : "Kategori güncellendi",
      });

      onSave(saved);
      onOpenChange(false);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? (e.data as any)?.detail || e.message
          : "Kategori kaydedilemedi.";

      toast({
        title: "Kaydedilemedi",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden"
          overlayClassName="bg-transparent"
        >
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{isNew ? "Yeni Kategori" : "Kategoriyi Düzenle"}</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-132px)]">
            <div className="space-y-4 mt-2">
              {/* Переводы (динамически из enabled_languages ресторана) */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label>Çeviri</Label>
                  {translatableLangs.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={translating || saving || !form.name_tr.trim()}
                      onClick={() => setConfirmTranslateOpen(true)}
                      title={!form.name_tr.trim() ? "Önce Türkçe isim girin" : undefined}
                    >
                      {translating ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1.5" />
                      )}
                      AI ile Çevir
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 mt-2 flex-wrap">
                  {langs.map((l) => (
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
                    <div>
                      <Label>İsim (TR)</Label>
                      <Input
                        value={form.name_tr}
                        maxLength={NAME_MAX}
                        onChange={(e) => update("name_tr", e.target.value)}
                        className={nameTrError ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {nameTrError && <p className="mt-2 text-sm text-red-500">{nameTrError}</p>}
                    </div>
                  )}

                  {activeLang === "en" && (
                    <div>
                      <Label>İsim (EN)</Label>
                      <Input
                        value={form.name_en}
                        maxLength={NAME_MAX}
                        onChange={(e) => update("name_en", e.target.value)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{AI_NAME_HINT}</p>
                    </div>
                  )}

                  {activeLang === "ru" && (
                    <div>
                      <Label>İsim (RU)</Label>
                      <Input
                        value={form.name_ru}
                        maxLength={NAME_MAX}
                        onChange={(e) => update("name_ru", e.target.value)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{AI_NAME_HINT}</p>
                    </div>
                  )}

                  {activeLang !== "tr" && activeLang !== "en" && activeLang !== "ru" && (
                    <div>
                      <Label>İsim ({activeLang.toUpperCase()})</Label>
                      <Input
                        value={form.name_i18n?.[activeLang] ?? ""}
                        maxLength={NAME_MAX}
                        onChange={(e) => updateI18nName(activeLang, e.target.value)}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{AI_NAME_HINT}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-background flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving || translating}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmTranslateOpen} onOpenChange={setConfirmTranslateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çeviri yapılsın mı?</AlertDialogTitle>
            <AlertDialogDescription>
              İsim {translatableLangs.map((l) => l.toUpperCase()).join(", ")} diline/dillerine
              çevrilecek. Mevcut çeviri alanlarının üzerine yazılacak — kaydetmeden önce
              kontrol edebilirsiniz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={runTranslate}>Çevir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
