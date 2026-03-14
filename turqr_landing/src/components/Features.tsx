import { useLanguage } from "@/i18n/LanguageContext";
import { Languages, QrCode, RefreshCw, Printer } from "lucide-react";

const Features = () => {
  const { t } = useLanguage();

  const features = [
    // ✅ Экономия на печати — теперь первый блок
    {
      icon: Printer,
      title: t.features.f4,
      desc: t.features.f4desc,
    },
    { icon: RefreshCw, title: t.features.f3, desc: t.features.f3desc },
    { icon: QrCode, title: t.features.f2, desc: t.features.f2desc },
    { icon: Languages, title: t.features.f1, desc: t.features.f1desc },
  ];

  return (
    <section id="features" className="py-20 md:py-28 gradient-warm">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            {t.features.title}
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <f.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                {f.title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;