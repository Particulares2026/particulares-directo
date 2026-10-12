import { after } from "next/server";

const HOST = "www.particularesdirecto.com";
const ORIGIN = "https://" + HOST;
const KEY = "241f9bdc9ec130a9e0e5b95d391fade23cef72e25c5933d7";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only call after an authorized mutation succeeds. No arbitrary URLs or user data.
export function notificarIndexNow(id?: string) {
  programarNotificacion(id);
}

// Capture anonymous public eligibility before hiding/deleting. The returned
// callback must only run after the authorized mutation succeeds. Callers cannot
// assert public eligibility with a flag or supply an arbitrary URL.
export async function prepararRetiradaIndexNow(id: string): Promise<() => void> {
  if (process.env.VERCEL_ENV !== "production" || typeof id !== "string" || !UUID.test(id)) return () => {};
  let publico = false;
  try {
    const sitemap = await fetch(ORIGIN + "/sitemap.xml", {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4000),
    });
    if (sitemap.ok) publico = (await sitemap.text()).includes("<loc>" + ORIGIN + "/anuncio/" + id + "</loc>");
  } catch { console.warn("IndexNow: public eligibility unavailable"); }
  return () => programarNotificacion(publico ? id : undefined, publico);
}

function programarNotificacion(id?: string, publicoAntes = false) {
  if (process.env.VERCEL_ENV !== "production") return;
  if (id !== undefined && (typeof id !== "string" || !UUID.test(id))) return;
  try {
    after(async () => {
      try {
        const urlList = [ORIGIN + "/"];
        if (id && publicoAntes) urlList.push(ORIGIN + "/anuncio/" + id);
        else if (id) {
          // Membership in the current public sitemap excludes hidden/private listings.
          // No cookies, authorization headers or privileged database credentials.
          const sitemap = await fetch(ORIGIN + "/sitemap.xml", {
            cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4000),
          });
          if (!sitemap.ok) throw new Error("sitemap unavailable");
          const xml = await sitemap.text();
          const url = ORIGIN + "/anuncio/" + id;
          if (xml.includes("<loc>" + url + "</loc>")) urlList.push(url);
        }
        const result = await fetch("https://api.indexnow.org/indexnow", {
          method: "POST", redirect: "error", signal: AbortSignal.timeout(4000),
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({host: HOST, key: KEY, keyLocation: ORIGIN + "/" + KEY + ".txt", urlList}),
        });
        if (result.status !== 200 && result.status !== 202)
          console.warn("IndexNow: notification not accepted", result.status);
      } catch {
        // Best effort: a search engine outage must never undo a saved listing.
        // Log only an aggregate signal; the sitemap remains the discovery fallback.
        console.warn("IndexNow: notification unavailable");
      }
    });
  } catch { console.warn("IndexNow: scheduling unavailable"); }
}
