const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:8000";

export function resolveLogoUrl(raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";

  // absolute URL
  if (v.startsWith("http://") || v.startsWith("https://")) return v;

  // ensure leading slash
  const path = v.startsWith("/") ? v : `/${v}`;

  // backend media
  if (path.startsWith("/media/")) return `${API_ORIGIN}${path}`;

  // frontend public (e.g. /platform/...)
  return path;
}
