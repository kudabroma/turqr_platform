import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { QrCode, Utensils, Star, ArrowRight } from "lucide-react";
import { useState } from "react";
import LeadFormModal from "./LeadFormModal";

const HeroSection = () => {
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden gradient-hero">
        {/* Floating decorations */}
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
                {t.hero.title}
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
              <div className="relative w-[280px] h-[560px] bg-foreground rounded-[3rem] p-3 shadow-elevated">
                <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden flex flex-col">
                  {/* Status bar */}
                  <div className="gradient-primary px-5 pt-10 pb-4">
                    <p className="text-primary-foreground font-display font-bold text-lg">
                      La Dolce Vita
                    </p>
                    <p className="text-primary-foreground/70 text-xs mt-0.5">
                      Italian Restaurant
                    </p>
                  </div>

                  {/* Categories */}
                  <div className="flex gap-2 px-4 py-3 overflow-hidden">
                    {["🍕 Pizza", "🍝 Pasta", "🥗 Salad"].map((cat) => (
                      <span
                        key={cat}
                        className="text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full whitespace-nowrap"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Menu items */}
                  <div className="flex flex-col gap-3 px-4 pb-4 flex-1">
                    {[
                      { name: "Margherita", price: "₺120", emoji: "🍕" },
                      { name: "Spaghetti Carbonara", price: "₺140", emoji: "🍝" },
                      { name: "Caesar Salad", price: "₺95", emoji: "🥗" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3"
                      >
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Classic recipe
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gradient">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
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