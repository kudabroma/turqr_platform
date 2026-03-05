import { useLanguage } from "@/i18n/LanguageContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import LeadFormModal from "./LeadFormModal";

const Footer = () => {
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <footer className="bg-foreground text-primary-foreground py-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <span className="text-2xl font-display font-bold">TurQR</span>
              <p className="mt-3 text-sm opacity-70">{t.footer.desc}</p>
            </div>
            <div className="flex flex-col gap-2">
              <a href="#contact" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.footer.contact}</a>
              <a href="#" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.footer.privacy}</a>
              <a href="#" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t.footer.terms}</a>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setFormOpen(true)} className="gradient-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-opacity w-fit">
                {t.nav.cta}
              </Button>
            </div>
          </div>
          <div className="border-t border-primary-foreground/10 mt-10 pt-6 text-center text-xs opacity-50">
            © {new Date().getFullYear()} TurQR
          </div>
        </div>
      </footer>
      <LeadFormModal open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
};

export default Footer;
