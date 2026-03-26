import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

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

const ACCENT_PATTERNS = [
  /online QR menu/i,
  /çevrimiçi QR menü/i,
  /QR menünüz/i,
  /QR menü/i,
  /QR menu/i,
];

const LeadFormSection = () => {
  const { t } = useLanguage();

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [form, setForm] = useState<LeadFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL ?? "https://api.turqr.com/api";
  const formTitle = t.form.title;

  const accentMatch = ACCENT_PATTERNS.map((pattern) => formTitle.match(pattern)).find(Boolean);
  const accentText = accentMatch?.[0] ?? "";
  const accentStart = accentMatch?.index ?? -1;
  const accentEnd = accentStart >= 0 ? accentStart + accentText.length : -1;

  const beforeAccent = accentStart >= 0 ? formTitle.slice(0, accentStart) : formTitle;
  const afterAccent = accentEnd >= 0 ? formTitle.slice(accentEnd) : "";

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
      setForm(INITIAL_FORM);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section id="contact" className="py-20 md:py-28 gradient-warm">
        <div className="container flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-xl font-semibold text-foreground">{t.form.success}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 md:py-28 gradient-warm">
      <div className="container max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
            {accentText ? (
              <>
                {beforeAccent}
                <span className="text-[#e64a19] font-extrabold">{accentText}</span>
                {afterAccent}
              </>
            ) : (
              formTitle
            )}
          </h2>

          <p className="text-muted-foreground mt-3">{t.form.subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl p-8 shadow-card flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.form.name}</Label>
            <Input
              id="name"
              required
              autoComplete="name"
              value={form.name}
              maxLength={FIELD_LIMITS.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setField("name", sanitizeNameOrCity(e.target.value, FIELD_LIMITS.name))
              }
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.name.length}/{FIELD_LIMITS.name}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="restaurant">{t.form.restaurant}</Label>
            <Input
              id="restaurant"
              required
              autoComplete="organization"
              value={form.restaurant}
              maxLength={FIELD_LIMITS.restaurant}
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
            <Label htmlFor="city">{t.form.city}</Label>
            <Input
              id="city"
              required
              autoComplete="address-level2"
              value={form.city}
              maxLength={FIELD_LIMITS.city}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setField("city", sanitizeNameOrCity(e.target.value, FIELD_LIMITS.city))
              }
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.city.length}/{FIELD_LIMITS.city}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">{t.form.phone}</Label>
            <Input
              id="phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+90 555 555 55 55"
              value={form.phone}
              maxLength={FIELD_LIMITS.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setField("phone", sanitizePhone(e.target.value, FIELD_LIMITS.phone))
              }
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.phone.length}/{FIELD_LIMITS.phone}
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="gradient-primary text-primary-foreground rounded-full font-semibold py-6 mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : t.form.submit}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default LeadFormSection;