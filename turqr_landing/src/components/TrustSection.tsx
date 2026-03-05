import { useLanguage } from "@/i18n/LanguageContext";
import { Check } from "lucide-react";

const TrustSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-12">{t.trust.title}</h2>
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {t.trust.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-card rounded-full px-5 py-3 shadow-card border border-border">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
