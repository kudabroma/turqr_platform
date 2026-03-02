import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

type Lang = "en" | "tr";

function normalizeLang(x: string | null): Lang {
  const v = (x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  return "tr";
}

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
];

export function LanguageSwitcher() {
  const [searchParams] = useSearchParams();
  const current = normalizeLang(searchParams.get("lang"));

  const navigate = useNavigate();
  const location = useLocation();

  const nextSearchFor = useMemo(() => {
    return (lang: Lang) => {
      const sp = new URLSearchParams(searchParams);
      sp.set("lang", lang);
      return sp.toString();
    };
  }, [searchParams]);

  function setLang(lang: Lang) {
    const search = nextSearchFor(lang);
    navigate({ pathname: location.pathname, search: `?${search}` }, { replace: true });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex rounded-full bg-muted p-1">
        {LANGS.map((l) => {
          const active = l.code === current;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={[
                "px-4 py-1.5 text-sm font-semibold rounded-full transition-all select-none",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60",
              ].join(" ")}
              aria-pressed={active}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}