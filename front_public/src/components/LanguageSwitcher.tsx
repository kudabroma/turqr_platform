import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getLangMeta } from "@/config/langConfig";

interface LanguageSwitcherProps {
  enabledLanguages?: string[];
}

const PILL_THRESHOLD = 4;
const DEFAULT_LANGUAGES = ["tr", "ru", "en"];

export function LanguageSwitcher({ enabledLanguages }: LanguageSwitcherProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const langs = enabledLanguages?.length ? enabledLanguages : DEFAULT_LANGUAGES;
  const currentLang = searchParams.get("lang") ?? langs[0];

  function setLang(lang: string) {
    const sp = new URLSearchParams(searchParams);
    sp.set("lang", lang);
    navigate(
      { pathname: location.pathname, search: `?${sp.toString()}` },
      { replace: true }
    );
  }

  if (langs.length === 0) return null;

  if (langs.length >= PILL_THRESHOLD) {
    return (
      <select
        value={currentLang}
        onChange={(e) => setLang(e.target.value)}
        className="rounded-full bg-muted border-0 px-3 py-1.5 text-sm font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label="Select language"
      >
        {langs.map((code) => {
          const { flag, label } = getLangMeta(code);
          return (
            <option key={code} value={code}>
              {flag} {label}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex rounded-full bg-muted p-1">
        {langs.map((code) => {
          const { flag, label } = getLangMeta(code);
          const active = code === currentLang;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={[
                "px-3 py-1.5 text-sm font-semibold rounded-full transition-all select-none",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              ].join(" ")}
              aria-pressed={active}
            >
              {flag} {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
