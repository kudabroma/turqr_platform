import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadFormModal = ({ open, onOpenChange }: Props) => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", restaurant: "", city: "", phone: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) setTimeout(() => { setSubmitted(false); setForm({ name: "", restaurant: "", city: "", phone: "" }); }, 300);
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
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{t.form.title}</DialogTitle>
              <DialogDescription>{t.form.subtitle}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="modal-name">{t.form.name}</Label>
                <Input id="modal-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-restaurant">{t.form.restaurant}</Label>
                <Input id="modal-restaurant" required value={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-city">{t.form.city}</Label>
                <Input id="modal-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-phone">{t.form.phone}</Label>
                <Input id="modal-phone" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <Button type="submit" className="gradient-primary text-primary-foreground rounded-full font-semibold mt-2 hover:opacity-90 transition-opacity">
                {t.form.submit}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormModal;
