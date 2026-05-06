import { useEffect, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { restaurantApi, type RestaurantMe } from "@/api/endpoints";

type Lang = "tr" | "en" | "ru";

type RestaurantWithExtraFields = RestaurantMe & {
  working_hours?: string | null;
  description_tr?: string | null;
  description_en?: string | null;
  description_ru?: string | null;
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
};

type RestaurantUpdatePayload = Partial<RestaurantMe> & {
  working_hours?: string;
  description_tr?: string;
  description_en?: string;
  description_ru?: string;
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
  const [activeLang, setActiveLang] = useState<Lang>("tr");

  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    if (!open) return;

    setForm({
      name: restaurant.name ?? "",
      address: restaurant.address ?? "",
      phone: restaurant.phone ?? "",
      email: restaurant.email ?? "",
      contacts: restaurant.contacts ?? "",
      working_hours: restaurant.working_hours ?? "",
      description_tr: restaurant.description_tr ?? "",
      description_en: restaurant.description_en ?? "",
      description_ru: restaurant.description_ru ?? "",
    });

    setActiveLang("tr");
  }, [open, restaurant]);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    };

    mutation.mutate(payload);
  };

  const currentDescriptionLength =
    activeLang === "tr"
      ? form.description_tr.length
      : activeLang === "en"
      ? form.description_en.length
      : form.description_ru.length;

  return (
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
              <Label>Açıklama</Label>

              <div className="flex gap-2 mt-2 mb-2">
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

                <button
                  type="button"
                  onClick={() => setActiveLang("ru")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeLang === "ru"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  RU
                </button>
              </div>

              {activeLang === "tr" ? (
                <Textarea
                  value={form.description_tr}
                  maxLength={FIELD_LIMITS.description}
                  onChange={handleInputChange("description_tr", sanitizeMultilineText, FIELD_LIMITS.description)}
                  placeholder="Restoran açıklaması (Türkçe)"
                  rows={4}
                />
              ) : activeLang === "en" ? (
                <Textarea
                  value={form.description_en}
                  maxLength={FIELD_LIMITS.description}
                  onChange={handleInputChange("description_en", sanitizeMultilineText, FIELD_LIMITS.description)}
                  placeholder="Restoran açıklaması (İngilizce)"
                  rows={4}
                />
              ) : (
                <Textarea
                  value={form.description_ru}
                  maxLength={FIELD_LIMITS.description}
                  onChange={handleInputChange("description_ru", sanitizeMultilineText, FIELD_LIMITS.description)}
                  placeholder="Описание ресторана (Русский)"
                  rows={4}
                />
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
  );
}