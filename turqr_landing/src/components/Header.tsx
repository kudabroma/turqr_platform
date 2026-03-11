import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadFormModal from "./LeadFormModal";

const Header = () => {
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const navLinks = [
    { label: t.nav.howItWorks, href: "#how-it-works" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.faq, href: "#faq" },
    { label: t.nav.contact, href: "#contact" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">

          {/* LEFT — Logo + Language */}
          <div className="flex items-center gap-4">
            <a href="#">
              <img
                src="/Turlogo.png"
                alt="TurQR"
                className="h-9 w-auto object-contain"
              />
            </a>

            <button
              onClick={() => setLang(lang === "en" ? "tr" : "en")}
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-4 h-4" />
              {lang === "en" ? "TR" : "EN"}
            </button>
          </div>

          {/* CENTER nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* RIGHT */}
          <div className="hidden md:flex items-center gap-10">
            <a
              href="https://app.turqr.com"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.nav.login}
            </a>

            <Button
              onClick={() => setFormOpen(true)}
              className="gradient-primary text-primary-foreground rounded-full px-6 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t.nav.cta}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-background border-b border-border pb-4">
            <nav className="container flex flex-col gap-3">

              {/* Language on mobile */}
              <button
                onClick={() => setLang(lang === "en" ? "tr" : "en")}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground py-1"
              >
                <Globe className="w-4 h-4" />
                {lang === "en" ? "TR" : "EN"}
              </button>

              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-muted-foreground py-1"
                >
                  {l.label}
                </a>
              ))}

              <a
                href="https://app.turqr.com"
                className="text-sm font-medium text-muted-foreground pt-2"
              >
                {t.nav.login}
              </a>

              <Button
                onClick={() => {
                  setFormOpen(true);
                  setMobileOpen(false);
                }}
                className="gradient-primary text-primary-foreground rounded-full text-sm font-semibold mt-1"
              >
                {t.nav.cta}
              </Button>
            </nav>
          </div>
        )}
      </header>

      <LeadFormModal open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
};

export default Header;