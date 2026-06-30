export interface LangMeta {
  flag: string;
  label: string;
}

export const LANG_META: Record<string, LangMeta> = {
  tr: { flag: "🇹🇷", label: "TR" },
  ru: { flag: "🇷🇺", label: "RU" },
  en: { flag: "🇬🇧", label: "EN" },
  de: { flag: "🇩🇪", label: "DE" },
  no: { flag: "🇳🇴", label: "NO" },
  da: { flag: "🇩🇰", label: "DA" },
  sv: { flag: "🇸🇪", label: "SV" },
  fi: { flag: "🇫🇮", label: "FI" },
};

export function getLangMeta(code: string): LangMeta {
  return LANG_META[code] ?? { flag: "🌐", label: code.toUpperCase() };
}
