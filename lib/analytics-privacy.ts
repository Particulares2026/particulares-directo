export const GA_ID = "G-M2F8SWTL4B";
export const CONSENT_STORAGE_KEY = "particulares-directo-cookie-consent";
const ORIGIN = "https://www.particularesdirecto.com";
const PAGINAS = ["/", "/registro", "/publicar", "/precios-m2", "/calculadora-hipoteca", "/aviso-legal", "/terminos",
 "/guias", "/guias/plantilla-anuncio-vivienda", "/guias/reconocer-anuncios-sospechosos",
 ...["inmobiliaria","trabajo","coches","moda","muebles-hogar","mascotas","tecnologia","deporte"].map(c=>"/categoria/"+c)];
export function contextoAnalitico(href: string, referrer: string) {
 let url: URL;
 try { url = new URL(href); } catch { return null; }
 if (url.origin !== ORIGIN || !PAGINAS.includes(url.pathname)) return null;
 const fuentes: Record<string,string> = {"www.google.com":"google","www.google.es":"google",
 "www.bing.com":"bing","bing.com":"bing","duckduckgo.com":"duckduckgo","es.search.yahoo.com":"yahoo",
 "chatgpt.com":"chatgpt","chat.openai.com":"chatgpt","perplexity.ai":"perplexity","www.perplexity.ai":"perplexity",
 "copilot.microsoft.com":"copilot","gemini.google.com":"gemini","claude.ai":"claude"};
 let page_referrer = ""; let origen_visita = "no_identificado";
 try { const ref = new URL(referrer);
  if (ref.protocol==="https:" && !ref.username && !ref.password && typeof fuentes[ref.hostname] === "string") {
   page_referrer=ref.origin+"/"; origen_visita=fuentes[ref.hostname];
  }
 } catch { /* No referrer is normal. */ }
 const conocidas: Record<string,string> = {"chatgpt.com":"chatgpt",chatgpt:"chatgpt",perplexity:"perplexity",copilot:"copilot",gemini:"gemini",claude:"claude",whatsapp:"whatsapp"};
 const candidate=conocidas[url.searchParams.get("utm_source")?.toLowerCase() || ""];
 const source=typeof candidate === "string" ? candidate : undefined;
 const campaign = source ? {campaign_source:source==="chatgpt"?"chatgpt.com":source,
   campaign_medium:source==="whatsapp"?"organic_social":"ai-assistant"} : {};
 return {page_location:ORIGIN+url.pathname,page_title:"Particulares Directo",page_referrer,
   origen_visita:source || origen_visita,...campaign};
}
const OPCIONES: Record<string,string[]> = {
 role:["particular","profesional"], user_role:["particular","profesional"],
 cta_location:["home_hero","main_navigation","home_registration_banner","first_visit_guide"],
 ad_category:["inmobiliaria","trabajo","coches","moda","muebles-hogar","mascotas","tecnologia","deporte"],
 ad_type:["busco","ofrezco"], action:["create","edit"], method:["email","whatsapp"],
 stage:["validation","provider"],reason:["invalid_phone","legal_consent_missing","security_check_missing","signup_rejected"],
 content_type:["anuncio"]
};
const EVENTOS: Record<string,string[]> = {
 registration_cta_click:["cta_location","ad_category"],registration_start:["role"],registration_submit:["role"],
 registration_error:["stage","reason"],sign_up:["method","role"],
 ad_publish_start:["ad_category","action","is_first_ad"],ad_publish_success:["ad_category","ad_type","action","is_first_ad"],
 share:["method","content_type"]
};
export function parametrosEvento(evento: string, params: Record<string,unknown>) {
 const campos = EVENTOS[evento]; if (!Array.isArray(campos)) return null;
 const seguros: Record<string,string|boolean> = {};
 for(const campo of campos) {
  const valor=params[campo];
  if(campo==="is_first_ad" && typeof valor==="boolean") seguros[campo]=valor;
  else if(typeof valor==="string" && OPCIONES[campo]?.includes(valor)) seguros[campo]=valor;
 }
 return seguros;
}
export function propiedadesUsuario(params: Record<string,unknown>) {
 return typeof params.user_role==="string" && OPCIONES.user_role.includes(params.user_role) ? {user_role:params.user_role} : null;
}
