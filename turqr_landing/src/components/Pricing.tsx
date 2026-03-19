import { useLanguage } from "@/i18n/LanguageContext";
import { X, Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const DISCOUNT_END_MS = new Date("2026-04-30T23:59:59").getTime();

function getTimeLeft() {
  const diff = DISCOUNT_END_MS - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function useCountdown() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTimeLeft());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

const Pricing = () => {
  const { t } = useLanguage();
  const countdown = useCountdown();

  const printingMinuses = [
    t.pricing.print_minus1,
    t.pricing.print_minus2,
    t.pricing.print_minus3,
    t.pricing.print_minus4,
  ];

  const basicFeatures = [
    t.pricing.basic_f1,
    t.pricing.basic_f2,
    t.pricing.basic_f3,
    t.pricing.basic_f4,
    t.pricing.basic_f5,
    t.pricing.basic_f6,
  ];

  const proFeatures = [
    t.pricing.pro_f1,
    t.pricing.pro_f2,
    t.pricing.pro_f3,
    t.pricing.pro_f4,
  ];

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section id="pricing" className="py-20 md:py-28 bg-background">
      <div className="container">

        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            {t.pricing.title}{" "}
            <span className="text-primary">{t.pricing.titleHighlight}</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-lg">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">

          {/* 1 — Печатное меню */}
          <div className="relative bg-card border border-border rounded-2xl p-8 flex flex-col gap-5">
            <div className="absolute inset-0 rounded-2xl bg-muted/30 pointer-events-none" />

            <div className="relative z-10">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                {t.pricing.print_label}
              </p>
              <h3 className="text-xl font-display font-bold text-foreground">
                {t.pricing.print_title}
              </h3>
            </div>

            <div className="relative z-10">
              <p className="text-3xl font-bold text-foreground">
                ₺970
                <span className="text-sm font-normal text-muted-foreground"> /{t.pricing.per_month}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t.pricing.print_avg}</p>
            </div>

            <ul className="relative z-10 flex flex-col gap-3 flex-1">
              {printingMinuses.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 2 — Basic */}
          <div className="relative bg-card border-2 border-primary rounded-2xl p-8 flex flex-col gap-5 shadow-elevated">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                {t.pricing.recommended}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-display font-bold text-foreground">
                {t.pricing.basic_title}
              </h3>
            </div>

            <div>
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold text-foreground">
                  ₺990
                  <span className="text-sm font-normal text-muted-foreground"> /{t.pricing.per_month}</span>
                </p>
                <p className="text-lg font-medium text-muted-foreground line-through">₺1,490</p>
              </div>
              <p className="text-xs text-primary mt-1 font-medium">{t.pricing.basic_saving}</p>

              {/* Таймер — без русских букв */}
              <div className="mt-3 border border-primary/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <p className="text-xs text-primary font-medium">{t.pricing.discount_until}</p>
                <span className="ml-auto font-mono text-sm font-bold text-primary tabular-nums">
                  {countdown.days}d {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
                </span>
              </div>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {basicFeatures.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="#contact"
              className="mt-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl text-center transition-all duration-200 hover:shadow-md"
            >
              {t.pricing.basic_cta}
            </a>
          </div>

          {/* 3 — Pro */}
          <div className="relative bg-card border border-border rounded-2xl p-8 flex flex-col gap-5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-muted text-muted-foreground text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {t.pricing.coming_soon}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-display font-bold text-foreground">
                {t.pricing.pro_title}
              </h3>
            </div>

            <div>
              <p className="text-3xl font-bold text-muted-foreground">
                ₺2,490
                <span className="text-sm font-normal text-muted-foreground"> /{t.pricing.per_month}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t.pricing.pro_soon_note}</p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              {proFeatures.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              disabled
              className="mt-2 w-full bg-muted text-muted-foreground font-semibold py-3 px-6 rounded-xl text-center cursor-not-allowed opacity-60"
            >
              {t.pricing.pro_cta}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Pricing;