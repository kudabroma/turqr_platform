import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { QrCode, Utensils, Star, ArrowRight } from "lucide-react";
import { useState } from "react";
import LeadFormModal from "./LeadFormModal";

const HeroSection = () => {
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);

  const title = t.hero.title;

  const accentMatch =
    title.match(/in 2 hours/i) ||
    title.match(/2 saat içinde alın/i) ||
    title.match(/2 saat içinde hazır/i) ||
    title.match(/2 saat içinde/i);

  const accentText = accentMatch?.[0] ?? "";
  const beforeAccent = accentText ? title.replace(accentText, "").trim() : title;

  return (
    <>
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden gradient-hero">
        <div className="absolute top-20 left-[10%] w-12 h-12 rounded-xl gradient-primary opacity-10 animate-float" />
        <div
          className="absolute top-40 right-[15%] w-16 h-16 rounded-2xl gradient-primary opacity-10 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 left-[20%] w-10 h-10 rounded-lg gradient-primary opacity-10 animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="container relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="flex flex-col gap-6 max-w-xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-foreground">
                {beforeAccent}{" "}
                {accentText && (
                  <span className="text-[#e64a19] font-extrabold">
                    {accentText}
                  </span>
                )}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setFormOpen(true)}
                  className="gradient-primary text-primary-foreground rounded-full px-8 py-6 text-base font-semibold hover:opacity-90 transition-opacity"
                >
                  {t.hero.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center">
              <div className="relative w-[350px] h-[640px] bg-foreground rounded-[3rem] p-3 shadow-elevated">
                <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden">
                  <iframe
                    src="http://demores.localhost:8080/menu?lang=en"
                    title="TurQR Demo Menu"
                    className="w-full h-full border-0 rounded-[2.5rem] bg-white"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Floating icons */}
              <div className="absolute -top-2 -right-4 md:right-0 w-14 h-14 bg-card rounded-2xl shadow-card flex items-center justify-center animate-float">
                <QrCode className="w-7 h-7 text-primary" />
              </div>

              <div
                className="absolute bottom-12 -left-6 md:left-0 w-14 h-14 bg-card rounded-2xl shadow-card flex items-center justify-center animate-float"
                style={{ animationDelay: "1.5s" }}
              >
                <Utensils className="w-7 h-7 text-accent" />
              </div>

              <div
                className="absolute top-1/3 -right-8 md:-right-2 w-12 h-12 bg-card rounded-xl shadow-card flex items-center justify-center animate-float"
                style={{ animationDelay: "0.8s" }}
              >
                <Star className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <LeadFormModal open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
};

export default HeroSection;