import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LeadFormState = {
  name: string;
  restaurant: string;
  city: string;
  phone: string;
};

const FIELD_LIMITS = {
  name: 50,
  restaurant: 80,
  city: 50,
  phone: 20,
} as const;

const INITIAL_FORM: LeadFormState = {
  name: "",
  restaurant: "",
  city: "",
  phone: "",
};

const NAME_CITY_REGEX = /[^a-zA-Zа-яА-ЯёЁıİğĞüÜşŞöÖçÇ\s'-]/g;
const RESTAURANT_REGEX = /[^a-zA-Zа-яА-ЯёЁ0-9ıİğĞüÜşŞöÖçÇ\s&.,'"()\-]/g;
const PHONE_REGEX = /[^\d+\s()\-]/g;

function sanitizeNameOrCity(value: string, maxLength: number): string {
  return value.replace(NAME_CITY_REGEX, "").slice(0, maxLength);
}

function sanitizeRestaurant(value: string, maxLength: number): string {
  return value.replace(RESTAURANT_REGEX, "").slice(0, maxLength);
}

function sanitizePhone(value: string, maxLength: number): string {
  let sanitized = value.replace(PHONE_REGEX, "");

  if (sanitized.includes("+")) {
    sanitized = sanitized[0] + sanitized.slice(1).replace(/\+/g, "");
  }

  return sanitized.slice(0, maxLength);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

const LeadFormModal = ({ open, onOpenChange }: Props) => {
  const { t } = useLanguage();

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [form, setForm] = useState<LeadFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL ?? "https://api.turqr.com/api";

  const setField = <K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): string | null => {
    const trimmedName = form.name.trim();
    const trimmedRestaurant = form.restaurant.trim();
    const trimmedCity = form.city.trim();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName || !trimmedRestaurant || !trimmedCity || !trimmedPhone) {
      return "Please fill in all fields.";
    }

    if (trimmedPhone.replace(/\D/g, "").length < 7) {
      return "Please enter a valid phone number.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        restaurant: form.restaurant.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
      };

      const res = await fetch(`${API_BASE}/lead/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;

        try {
          const data: unknown = await res.json();

          if (
            typeof data === "object" &&
            data !== null &&
            "detail" in data &&
            typeof data.detail === "string"
          ) {
            msg = data.detail;
          }
        } catch {
          // ignore json parse errors
        }

        throw new Error(msg);
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setTimeout(() => {
        setSubmitted(false);
        setIsSubmitting(false);
        setError(null);
        setForm(INITIAL_FORM);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="
          w-[calc(100vw-2rem)]
          max-w-[560px]
          rounded-[28px]
          border border-border/40
          bg-background
          p-0
          shadow-[0_24px_80px_rgba(0,0,0,0.18)]
          overflow-hidden
          gap-0
        "
      >
        {submitted ? (
          <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            </div>

            <p className="text-lg font-semibold text-foreground">{t.form.success}</p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-7 pt-7 pb-2 text-left sm:px-8 sm:pt-8">
              <DialogTitle className="pr-8 text-[30px] sm:text-[34px] font-semibold tracking-tight leading-[1.08] text-foreground">
                {t.form.title}
              </DialogTitle>

              <DialogDescription className="pt-2 text-[15px] sm:text-base leading-7 text-muted-foreground max-w-[440px]">
                {t.form.subtitle}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="px-7 pb-7 pt-2 sm:px-8 sm:pb-8">
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-name">{t.form.name}</Label>
                  <Input
                    id="modal-name"
                    required
                    autoComplete="name"
                    value={form.name}
                    maxLength={FIELD_LIMITS.name}
                    className="h-14 rounded-2xl px-4"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setField("name", sanitizeNameOrCity(e.target.value, FIELD_LIMITS.name))
                    }
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.name.length}/{FIELD_LIMITS.name}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-restaurant">{t.form.restaurant}</Label>
                  <Input
                    id="modal-restaurant"
                    required
                    autoComplete="organization"
                    value={form.restaurant}
                    maxLength={FIELD_LIMITS.restaurant}
                    className="h-14 rounded-2xl px-4"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setField(
                        "restaurant",
                        sanitizeRestaurant(e.target.value, FIELD_LIMITS.restaurant),
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.restaurant.length}/{FIELD_LIMITS.restaurant}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-city">{t.form.city}</Label>
                  <Input
                    id="modal-city"
                    required
                    autoComplete="address-level2"
                    value={form.city}
                    maxLength={FIELD_LIMITS.city}
                    className="h-14 rounded-2xl px-4"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setField("city", sanitizeNameOrCity(e.target.value, FIELD_LIMITS.city))
                    }
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.city.length}/{FIELD_LIMITS.city}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-phone">{t.form.phone}</Label>
                  <Input
                    id="modal-phone"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+90 555 555 55 55"
                    value={form.phone}
                    maxLength={FIELD_LIMITS.phone}
                    className="h-14 rounded-2xl px-4"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setField("phone", sanitizePhone(e.target.value, FIELD_LIMITS.phone))
                    }
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.phone.length}/{FIELD_LIMITS.phone}
                  </p>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-14 rounded-full gradient-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : t.form.submit}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormModal;