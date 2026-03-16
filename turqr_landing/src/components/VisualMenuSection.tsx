import { useLanguage } from "@/i18n/LanguageContext";
import { Check } from "lucide-react";

const VisualMenuSection = () => {
  const { t } = useLanguage();

  const points = [
    t.visualMenu.point1,
    t.visualMenu.point2,
    t.visualMenu.point3,
  ];

  const renderHighlightedTitle = (title: string, highlight?: string) => {
    if (!highlight || !title.includes(highlight)) {
      return title;
    }

    const parts = title.split(highlight);

    return (
      <>
        {parts[0]}
        <span className="text-primary">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <section id="visual-menu" className="py-20 md:py-28">
      <div className="container max-w-5xl">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-lg md:text-2xl font-bold uppercase tracking-[0.14em] text-primary mb-5">
            {t.visualMenu.eyebrow}
          </p>

          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight mb-6">
            {renderHighlightedTitle(
              t.visualMenu.title,
              t.visualMenu.titleHighlight
            )}
          </h2>

          <p className="text-muted-foreground text-base md:text-lg leading-8 max-w-2xl mx-auto">
            {t.visualMenu.description}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {points.map((point, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border px-5 py-4 shadow-card flex items-center justify-center gap-3 text-center"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-4 w-4" />
              </div>

              <span className="font-medium text-foreground leading-snug">
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VisualMenuSection;