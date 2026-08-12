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
