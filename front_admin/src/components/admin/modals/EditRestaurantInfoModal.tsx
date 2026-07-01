import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
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
import { ApiError } from "@/api/apiClient";

import { restaurantApi, type RestaurantMe } from "@/api/endpoints";

type Lang = string;
const DEFAULT_LANGS: Lang[] = ["tr", "en", "ru"];
const AI_DESC_HINT = "AI çevirisini kontrol edin, gerekirse düzenleyin.";

type RestaurantWithExtraFields = RestaurantMe & {
  working_hours?: string | null;
  description_tr?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
  description_i18n?: Record<string, string>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: RestaurantWithExtraFields;
};

type FormState = {
  name: string;
  address: string;
  phone: string;
  email: string;
  contacts: string;
  working_hours: string;
  description_tr: string;
  description_en: string;
  description_ru: string;
  // переводы для языков без отдельных flat-полей (de, no, da, sv, fi, ...)
  description_i18n: Record<string, string>;
};

type RestaurantUpdatePayload = Partial<RestaurantMe> & {
  working_hours?: string;
  description_tr?: string;
  description_en?: string;
  description_ru?: string;
  description_i18n?: Record<string, string>;
};

const FIELD_LIMITS = {
  name: 100,
  address: 200,
  phone: 20,
  email: 100,
  contacts: 500,
  working_hours: 50,
  description: 280,
} as const;

const INITIAL_FORM: FormState = {
  name: "",
  address: "",
  phone: "",
  email: "",
  contacts: "",
  working_hours: "",
  description_tr: "",
  description_en: "",
  description_ru: "",
  description_i18n: {},
};

const SINGLE_LINE_REGEX = /[^\p{L}\p{N}\s&.,'"()\-/:]/gu;
const MULTILINE_REGEX = /[^\p{L}\p{N}\s&.,'"()\-/:!?]/gu;
const PHONE_REGEX = /[^\d+\s()\-]/g;

function sanitizeSingleLineText(value: string, maxLength: number): string {
  return value
    .replace(SINGLE_LINE_REGEX, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);
}

function sanitizeMultilineText(value: string, maxLength: number): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(MULTILINE_REGEX, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart()
    .slice(0, maxLength);
}

function sanitizeWorkingHours(value: string, maxLength: number): string {
  return value
    .replace(/[^\p{L}\p{N}\s:.,()\-\/]/gu, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);
}

function sanitizePhone(value: string, maxLength: number): string {
  let sanitized = value.replace(PHONE_REGEX, "");

  if (sanitized.includes("+")) {
    sanitized = sanitized[0] + sanitized.slice(1).replace(/\+/g, "");
  }

  return sanitized.slice(0, maxLength);
}

function sanitizeEmail(value: string, maxLength: number): string {
  return value.replace(/\s+/g, "").slice(0, maxLength);
}

function getMutationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Kaydedilemedi.";
}

export function EditRestaurantInfoModal({
  open,
  onOpenChange,
  restaurant,
}: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeLang, setActiveLang] = useState<Lang>("tr");

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [translating, setTranslating] = useState(false);
  const [confirmTranslateOpen, setConfirmTranslateOpen] = useState(false);

  // tr всегда первый и всегда присутствует
  const langs = useMemo<Lang[]>(() => {
    const enabledLanguages = restaurant.enabled_languages;
    const base = enabledLanguages && enabledLanguages.length > 0 ? enabledLanguages : DEFAULT_LANGS;
    const uniq = Array.from(new Set(base));
    return uniq.includes("tr") ? ["tr", ...uniq.filter((l) => l !== "tr")] : ["tr", ...uniq];
  }, [restaurant.enabled_languages]);

  const translatableLangs = useMemo(() => langs.filter((l) => l !== "tr"), [langs]);

  // Держим последний проп в ref, чтобы эффект инициализации ниже мог читать
  // актуальные данные, но НЕ пересоздавать form при каждом обновлении пропа —
  // иначе фоновый refetch (например, refetchOnWindowFocus) молча затирает
  // ещё не сохранённые правки, пока модалка открыта.
  const restaurantRef = useRef(restaurant);
  useEffect(() => {
    restaurantRef.current = restaurant;
  }, [restaurant]);

  useEffect(() => {
    if (!open) return;

    const r = restaurantRef.current;
    setForm({
      name: r.name ?? "",
      address: r.address ?? "",
      phone: r.phone ?? "",
      email: r.email ?? "",
      contacts: r.contacts ?? "",
      working_hours: r.working_hours ?? "",
      description_tr: r.description_tr ?? "",
      description_en: r.description_en ?? "",
      description_ru: r.description_ru ?? "",
      description_i18n: { ...(r.description_i18n ?? {}) },
    });

    setActiveLang("tr");
    setTranslating(false);
    setConfirmTranslateOpen(false);
  }, [open]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateI18nDescription = (lang: string, value: string) => {
    const sanitized = sanitizeMultilineText(value, FIELD_LIMITS.description);
    setForm((prev) => ({
      ...prev,
      description_i18n: { ...prev.description_i18n, [lang]: sanitized },
    }));
  };

  const handleInputChange =
    (
      key: keyof FormState,
      sanitizer: (value: string, maxLength: number) => string,
      maxLength: number,
    ) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      update(key, sanitizer(e.target.value, maxLength));
    };

  const runTranslate = async () => {
    setConfirmTranslateOpen(false);

    if (!form.description_tr.trim() || translatableLangs.length === 0) return;

    setTranslating(true);
    try {
      const res = await restaurantApi.translate(form.description_tr.trim(), translatableLangs);

      setForm((prev) => {
        const nextI18n = { ...prev.description_i18n };
        let next_en = prev.description_en;
        let next_ru = prev.description_ru;

        for (const [lang, text] of Object.entries(res.translations)) {
          const sanitized = sanitizeMultilineText(text ?? "", FIELD_LIMITS.description);
          if (lang === "en") next_en = sanitized;
          else if (lang === "ru") next_ru = sanitized;
          else nextI18n[lang] = sanitized;
        }

        return {
          ...prev,
          description_en: next_en,
          description_ru: next_ru,
          description_i18n: nextI18n,
        };
      });

      toast({
        title: "Çeviri tamamlandı",
        description: "Açıklamaları kontrol edip Kaydet'e basın.",
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

  const mutation = useMutation({
    mutationFn: (payload: RestaurantUpdatePayload) => restaurantApi.update(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["restaurant", "me"] });
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    const payload: RestaurantUpdatePayload = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      contacts: form.contacts.trim(),
      working_hours: form.working_hours.trim(),
      description_tr: form.description_tr.trim(),
      description_en: form.description_en.trim(),
      description_ru: form.description_ru.trim(),
      description_i18n: form.description_i18n,
    };

    mutation.mutate(payload);
  };

  const currentDescriptionValue =
    activeLang === "tr"
      ? form.description_tr
      : activeLang === "en"
      ? form.description_en
      : activeLang === "ru"
      ? form.description_ru
      : form.description_i18n[activeLang] ?? "";

  const currentDescriptionLength = currentDescriptionValue.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Restoran Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-132px)]">
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>İsim</Label>
                <Input
                  value={form.name}
                  maxLength={FIELD_LIMITS.name}
                  onChange={handleInputChange(
                    "name",
                    sanitizeSingleLineText,
                    FIELD_LIMITS.name,
                  )}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.name.length}/{FIELD_LIMITS.name}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Adres</Label>
                <Input
                  value={form.address}
                  maxLength={FIELD_LIMITS.address}
                  onChange={handleInputChange(
                    "address",
                    sanitizeSingleLineText,
                    FIELD_LIMITS.address,
                  )}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.address.length}/{FIELD_LIMITS.address}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input
                  value={form.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={FIELD_LIMITS.phone}
                  onChange={handleInputChange("phone", sanitizePhone, FIELD_LIMITS.phone)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.phone.length}/{FIELD_LIMITS.phone}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>E-posta</Label>
                <Input
                  value={form.email}
                  maxLength={FIELD_LIMITS.email}
                  type="email"
                  autoComplete="email"
                  onChange={handleInputChange("email", sanitizeEmail, FIELD_LIMITS.email)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.email.length}/{FIELD_LIMITS.email}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Çalışma Saatleri</Label>
                <Input
                  value={form.working_hours}
                  maxLength={FIELD_LIMITS.working_hours}
                  onChange={handleInputChange(
                    "working_hours",
                    sanitizeWorkingHours,
                    FIELD_LIMITS.working_hours,
                  )}
                  placeholder="09:00 - 23:00"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.working_hours.length}/{FIELD_LIMITS.working_hours}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label>Açıklama</Label>
                  {translatableLangs.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={translating || !form.description_tr.trim()}
                      onClick={() => setConfirmTranslateOpen(true)}
                      title={!form.description_tr.trim() ? "Önce Türkçe açıklama girin" : undefined}
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

                <div className="flex gap-2 mt-2 mb-2 flex-wrap">
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

                {activeLang === "tr" && (
                  <Textarea
                    value={form.description_tr}
                    maxLength={FIELD_LIMITS.description}
                    onChange={handleInputChange("description_tr", sanitizeMultilineText, FIELD_LIMITS.description)}
                    placeholder="Restoran açıklaması (Türkçe)"
                    rows={4}
                  />
                )}

                {activeLang === "en" && (
                  <>
                    <Textarea
                      value={form.description_en}
                      maxLength={FIELD_LIMITS.description}
                      onChange={handleInputChange("description_en", sanitizeMultilineText, FIELD_LIMITS.description)}
                      placeholder="Restoran açıklaması (İngilizce)"
                      rows={4}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{AI_DESC_HINT}</p>
                  </>
                )}

                {activeLang === "ru" && (
                  <>
                    <Textarea
                      value={form.description_ru}
                      maxLength={FIELD_LIMITS.description}
                      onChange={handleInputChange("description_ru", sanitizeMultilineText, FIELD_LIMITS.description)}
                      placeholder="Описание ресторана (Русский)"
                      rows={4}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{AI_DESC_HINT}</p>
                  </>
                )}

                {activeLang !== "tr" && activeLang !== "en" && activeLang !== "ru" && (
                  <>
                    <Textarea
                      value={form.description_i18n[activeLang] ?? ""}
                      maxLength={FIELD_LIMITS.description}
                      onChange={(e) => updateI18nDescription(activeLang, e.target.value)}
                      placeholder={`Restoran açıklaması (${activeLang.toUpperCase()})`}
                      rows={4}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{AI_DESC_HINT}</p>
                  </>
                )}

                <p className="text-xs text-muted-foreground text-right">
                  {currentDescriptionLength}/{FIELD_LIMITS.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Ek İletişim Bilgileri (isteğe bağlı)</Label>
                <Textarea
                  value={form.contacts}
                  maxLength={FIELD_LIMITS.contacts}
                  onChange={handleInputChange(
                    "contacts",
                    sanitizeMultilineText,
                    FIELD_LIMITS.contacts,
                  )}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {form.contacts.length}/{FIELD_LIMITS.contacts}
                </p>
              </div>

              {mutation.isError && (
                <div className="text-sm text-red-600">
                  {getMutationErrorMessage(mutation.error)}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-background sticky bottom-0 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              İptal
            </Button>

            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmTranslateOpen} onOpenChange={setConfirmTranslateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çeviri yapılsın mı?</AlertDialogTitle>
            <AlertDialogDescription>
              Açıklama {translatableLangs.map((l) => l.toUpperCase()).join(", ")} diline/dillerine
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
