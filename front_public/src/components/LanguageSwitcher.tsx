import { useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Lang } from "@/api/public";

function normalizeLang(x: string | null): Lang {
  const v = (x ?? "tr").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ru")) return "ru";
  return "tr";
}

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
  { code: "ru", label: "RU" },
];

export function LanguageSwitcher() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const current = normalizeLang(searchParams.get("lang"));

  const nextSearchFor = useMemo(() => {
    return (lang: Lang) => {
      const sp = new URLSearchParams(searchParams);
      sp.set("lang", lang);
      const slug = searchParams.get("slug");
      if (slug) sp.set("slug", slug);
      return sp.toString();
    };
  }, [searchParams]);

  function setLang(lang: Lang) {
    const search = nextSearchFor(lang);
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true }
    );
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