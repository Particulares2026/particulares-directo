import { GA_ID, CONSENT_STORAGE_KEY, contextoAnalitico, parametrosEvento, propiedadesUsuario } from "./analytics-privacy";
type AnalyticsValue = string | number | boolean;
function contextoPermitido() {
 if(typeof window==="undefined" || typeof window.gtag !== "function") return null;
 try {
  if(window.localStorage.getItem(CONSENT_STORAGE_KEY)!=="granted"
   || (window as unknown as Record<string,unknown>)["ga-disable-"+GA_ID] !== false) return null;
 } catch { return null; }
 return contextoAnalitico(window.location.href, document.referrer);
}
export function trackGoogleAnalyticsEvent(eventName: string, parameters: Record<string,AnalyticsValue> = {}) {
 const contexto=contextoPermitido(); const seguros=parametrosEvento(eventName,parameters);
 if(!contexto || !seguros) return;
 window.gtag!("event",eventName,{...seguros,...contexto});
}
export function setGoogleAnalyticsUserProperties(properties: Record<string,AnalyticsValue>) {
 const contexto=contextoPermitido(); const seguros=propiedadesUsuario(properties);
 if(!contexto || !seguros) return;
 window.gtag!("set","user_properties",seguros);
}

