import { useLanguage } from "@/i18n/LanguageContext";
import { Check } from "lucide-react";

const TrustSection = () => {
  const { t } = useLanguage();

  const title = t.trust.title;

  const accentMatch =
    title.match(/Trust TurQR/i) ||
    title.match(/TurQR’ye Güveniyor/i) ||
    title.match(/TurQR'ye Güveniyor/i);

  const accentText = accentMatch?.[0] ?? "";
  const beforeAccent = accentText ? title.replace(accentText, "").trim() : title;

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground text-center mb-12 leading-tight">
          {beforeAccent}{" "}
          {accentText && (
            <span className="text-[#e64a19] font-extrabold">
              {accentText}
            </span>
          )}
        </h2>

        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {t.trust.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-card rounded-full px-6 py-4 shadow-card border border-border"
            >
              <Check className="w-5 h-5 text-[#e64a19] shrink-0" />
              <span className="text-base md:text-lg font-semibold text-foreground">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;