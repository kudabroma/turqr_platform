import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const FloatingCta = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroSection = document.querySelector("#hero");
    const contactSection = document.querySelector("#contact");

    const observer = new IntersectionObserver(
      () => {
        const heroRect = heroSection?.getBoundingClientRect();
        const contactRect = contactSection?.getBoundingClientRect();

        const pastHero = heroRect ? heroRect.bottom < 0 : false;
        const reachedContact = contactRect ? contactRect.top < window.innerHeight : false;

        setVisible(pastHero && !reachedContact);
      },
      { threshold: 0 }
    );

    const onScroll = () => {
        const heroSection = document.querySelector("#hero");
        const contactSection = document.querySelector("#contact");

        const heroRect = heroSection?.getBoundingClientRect();
        const contactRect = contactSection?.getBoundingClientRect();

        // Появляется когда hero прокрутился на 30% — не ждём полного исчезновения
        const pastHero = heroRect ? heroRect.top < -(heroRect.height * 0.3) : false;
        const reachedContact = contactRect ? contactRect.top < window.innerHeight * 0.8 : false;

        setVisible(pastHero && !reachedContact);
        };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <a
        href="#contact"
        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap text-sm md:text-base"
      >
        {t.hero.cta}
        <span className="text-lg leading-none">→</span>
      </a>
    </div>
  );
};

export default FloatingCta;