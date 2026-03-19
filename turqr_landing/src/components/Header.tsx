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
    { label: t.visualMenu.eyebrow, href: "#visual-menu" },
    { label: t.nav.howItWorks, href: "#how-it-works" },
    { label: t.nav.features, href: "#features" },
    { label: t.nav.pricing, href: "#pricing" },
    { label: t.nav.faq, href: "#faq" },
    { label: t.nav.contact, href: "#contact" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 shadow-sm">
        <div className="container flex items-center justify-between h-[72px]">
          {/* LEFT — Logo + Language */}
          <div className="flex items-center gap-4 lg:gap-5">
            <a href="#" className="shrink-0">
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
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 xl:gap-12">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors after:absolute after:left-0 after:-bottom-1 after:h-[1.5px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* RIGHT */}
          <div className="hidden md:flex items-center gap-12">
            <a
              href="https://app.turqr.com"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {t.nav.login}
            </a>

            <Button
              onClick={() => setFormOpen(true)}
              className="gradient-primary text-primary-foreground rounded-full px-6 h-11 text-sm font-semibold hover:opacity-90 transition-opacity shadow-soft"
            >
              {t.nav.cta}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
          <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
            <nav className="container flex flex-col gap-1 py-4">
              <button
                onClick={() => setLang(lang === "en" ? "tr" : "en")}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground py-2"
              >
                <Globe className="w-4 h-4" />
                {lang === "en" ? "TR" : "EN"}
              </button>

              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-muted-foreground py-2"
                >
                  {l.label}
                </a>
              ))}

              <a
                href="https://app.turqr.com"
                className="text-sm font-medium text-muted-foreground py-2"
              >
                {t.nav.login}
              </a>

              <Button
                onClick={() => {
                  setFormOpen(true);
                  setMobileOpen(false);
                }}
                className="gradient-primary text-primary-foreground rounded-full text-sm font-semibold mt-3 h-11"
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