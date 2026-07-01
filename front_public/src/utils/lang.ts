/**
 * Single source of truth for resolving the display language across the
 * public frontend. Every page used to carry its own copy of this logic —
 * MenuPage.tsx's was correct, PreviewPage.tsx's and CategoryTabs.tsx's were
 * hardcoded to only recognize tr/en/ru and silently fell back to "tr" for
 * any other language (de/no/da/sv/fi), even when the restaurant had that
 * language enabled. Import from here instead of redefining it.
 */
export function getRawLang(raw: string | null | undefined): string {
  return (raw ?? "").toLowerCase().trim().split("-")[0] || "tr";
}

export function normalizeLang(
  raw: string | null | undefined,
  enabledLanguages: string[]
): string {
  const v = getRawLang(raw);
  if (v && enabledLanguages.includes(v)) return v;
  return enabledLanguages[0] ?? "tr";
}
