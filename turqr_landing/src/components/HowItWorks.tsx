import { useLanguage } from "@/i18n/LanguageContext";
import { ClipboardList, Palette, QrCode } from "lucide-react";

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: ClipboardList, title: t.howItWorks.step1, desc: t.howItWorks.step1desc },
    { icon: Palette, title: t.howItWorks.step2, desc: t.howItWorks.step2desc },
    { icon: QrCode, title: t.howItWorks.step3, desc: t.howItWorks.step3desc },
  ];

  const title = t.howItWorks.title;

  const accentMatch =
    title.match(/3 steps/i) ||
    title.match(/3 simple steps/i) ||
    title.match(/3 easy steps/i) ||
    title.match(/3 adımda/i) ||
    title.match(/3 kolay adımda/i);

  const accentText = accentMatch?.[0] ?? "";
  const beforeAccent = accentText ? title.replace(accentText, "").trim() : title;

  return (
    <section id="how-it-works" className="py-20 md:py-28 gradient-warm">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
            {beforeAccent}{" "}
            {accentText && (
              <span className="text-[#e64a19] font-extrabold">
                {accentText}
              </span>
            )}
          </h2>

          <p className="text-muted-foreground mt-3 text-lg">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-soft">
                <step.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              <span className="text-lg font-bold text-[#e64a19] uppercase tracking-wider">
                Step {i + 1}
              </span>

              <h3 className="text-lg font-semibold text-foreground">
                {step.title}
              </h3>

              <p className="text-sm text-muted-foreground max-w-xs">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;