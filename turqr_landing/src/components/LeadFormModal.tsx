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

const INITIAL_FORM: LeadFormState = { name: "", restaurant: "", city: "", phone: "" };

const LeadFormModal = ({ open, onOpenChange }: Props) => {
  const { t } = useLanguage();

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<LeadFormState>(INITIAL_FORM);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL ?? "https://api.turqr.com/api/admin/api";

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
          // ignore
        }
        throw new Error(msg);
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">{t.form.success}</p>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-6 mb-2">
              <DialogTitle className="text-[32px] font-semibold tracking-tight leading-[1.1] text-foreground">
                {t.form.title}
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                {t.form.subtitle}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="modal-name">{t.form.name}</Label>
                <Input
                  id="modal-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-restaurant">{t.form.restaurant}</Label>
                <Input
                  id="modal-restaurant"
                  required
                  value={form.restaurant}
                  onChange={(e) => setForm({ ...form, restaurant: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-city">{t.form.city}</Label>
                <Input
                  id="modal-city"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-phone">{t.form.phone}</Label>
                <Input
                  id="modal-phone"
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
                className="gradient-primary text-primary-foreground rounded-full font-semibold mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : t.form.submit}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormModal; 
