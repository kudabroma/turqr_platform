import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

const LeadFormSection = () => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", restaurant: "", city: "", phone: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">{t.form.title}</h2>
          <p className="text-muted-foreground mt-3">{t.form.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.form.name}</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="restaurant">{t.form.restaurant}</Label>
            <Input id="restaurant" required value={form.restaurant} onChange={(e) => setForm({ ...form, restaurant: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">{t.form.city}</Label>
            <Input id="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t.form.phone}</Label>
            <Input id="phone" required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Button type="submit" className="gradient-primary text-primary-foreground rounded-full font-semibold py-6 mt-2 hover:opacity-90 transition-opacity">
            {t.form.submit}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default LeadFormSection;
