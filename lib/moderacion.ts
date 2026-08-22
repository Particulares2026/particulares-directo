// Lista de términos no permitidos: insultos graves, lenguaje xenófobo/discriminatorio
// y contenido de índole sexual o de prostitución. No es infalible (no detecta eufemismos
// nuevos), pero bloquea los casos más claros antes de publicar.
const TERMINOS_PROHIBIDOS: string[] = [
  // Insultos graves
  "hijo de puta", "hijoputa", "hijos de puta", "gilipollas", "cabron", "cabrones",
  "maricon de mierda", "subnormal", "retrasado mental", "mogolico", "mongolico",

  // Lenguaje xenófobo / discriminatorio
  "sudaca", "sudacas", "panchito", "panchitos", "moro de mierda", "moros de mierda",
  "negro de mierda", "negros de mierda", "gitano de mierda", "gitanos de mierda",
  "puto judio", "puta judia", "puto moro", "puta mora", "puto negro", "puta negra",
  "puto sudaca", "puta sudaca", "puto gitano", "puta gitana", "puto inmigrante",
  "puta inmigrante", "vuelve a tu pais", "vete a tu pais", "fuera inmigrantes",
  "fuera moros", "muerte a los inmigrantes",

  // Contenido sexual / prostitución
  "prostituta", "prostitutas", "prostitucion", "escort", "escorts", "gigolo", "gigolos",
  "servicio sexual", "servicios sexuales", "sexo por dinero", "sexo pago", "sexo pagado",
  "masaje erotico", "masajes eroticos", "masaje erotico a domicilio", "chica de compania",
  "chicas de compania", "acompanante vip", "acompanantes vip", "piso relax", "salon de relax",
  "club de alterne", "trio erotico", "webcam erotica", "video erotico personalizado",
];

function normaliza(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // quita acentos
}

export function contieneContenidoProhibido(
  ...textos: (string | null | undefined)[]
): { prohibido: boolean; termino?: string } {
  const contenido = normaliza(textos.filter(Boolean).join(" "));
  for (const termino of TERMINOS_PROHIBIDOS) {
    if (contenido.includes(termino)) {
      return { prohibido: true, termino };
    }
  }
  return { prohibido: false };
}

const PATRON_EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PATRON_ENLACE = /(?:https?:\/\/|www\.)\S+/i;
const PATRON_POSIBLE_TELEFONO = /(?:\+?\d[\s().-]*){8,15}/g;

/**
 * Evita que los datos de contacto se escriban en campos que se muestran sin
 * protección. El teléfono y el correo deben ir únicamente en la sección de
 * contacto, que se entrega a través del endpoint limitado de "Mostrar contacto".
 */
export function contieneContactoPublico(
  ...textos: (string | null | undefined)[]
): { encontrado: boolean; tipo?: "email" | "telefono" | "enlace" } {
  const contenido = textos.filter((texto): texto is string => typeof texto === "string").join(" ");

  if (PATRON_EMAIL.test(contenido)) return { encontrado: true, tipo: "email" };
  if (PATRON_ENLACE.test(contenido)) return { encontrado: true, tipo: "enlace" };

  const posiblesTelefonos = contenido.match(PATRON_POSIBLE_TELEFONO) || [];
  if (posiblesTelefonos.some((coincidencia) => {
    const digitos = coincidencia.replace(/\D/g, "");
    return digitos.length >= 8 && digitos.length <= 15;
  })) {
    return { encontrado: true, tipo: "telefono" };
  }

  return { encontrado: false };
}

