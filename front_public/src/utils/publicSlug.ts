export function getPublicSlugFromLocation(): string {
  // 1) query slug имеет приоритет (для ngrok / share links)
  const sp = new URLSearchParams(window.location.search);
  const q = (sp.get("slug") || "").trim();
  if (q) return q;

  // 2) subdomain (dev: *.localhost, prod: *.turqr.com)
  const host = window.location.hostname.toLowerCase(); // без порта
  const parts = host.split(".");

  // turko.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }

  // turko.turqr.com
  if (parts.length >= 3) {
    const root = parts.slice(-2).join("."); // turqr.com
    if (root === "turqr.com") {
      return parts[0];
    }
  }

  return "";
}