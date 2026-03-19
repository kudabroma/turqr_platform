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

const INITIAL_FORM: LeadFormState = {
  name: "",
  restaurant: "",
  city: "",
  phone: "",
};

const LeadFormSection = () => {
  const { t } = useLanguage();

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<LeadFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL ?? "https://turqrplatform-production.up.railway.app/api";

  const formTitle = t.form.title;

  const accentMatch =
    formTitle.match(/QR menu/i) ||
    formTitle.match(/online QR menu/i) ||
    formTitle.match(/QR menü/i) ||
    formTitle.match(/QR menünüz/i) ||
    formTitle.match(/çevrimiçi QR menü/i);

  const accentText = accentMatch?.[0] ?? "";
  const beforeAccent = accentText ? formTitle.replace(accentText, "").trim() : formTitle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/lead/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          restaurant: form.restaurant.trim(),
          city: form.city.trim(),
          phone: form.phone.trim(),
        }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;

        try {
          const data = await res.json();
          msg = data?.detail || msg;
        } catch {
          // ignore json parse error
        }

        throw new Error(msg);
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
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
            {beforeAccent}{" "}
            {accentText && (
              <span className="text-[#e64a19] font-extrabold">
                {accentText}
              </span>
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="restaurant">{t.form.restaurant}</Label>
            <Input
              id="restaurant"
              required
              value={form.restaurant}
              onChange={(e) => setForm({ ...form, restaurant: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">{t.form.city}</Label>
            <Input
              id="city"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">{t.form.phone}</Label>
            <Input
              id="phone"
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
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
