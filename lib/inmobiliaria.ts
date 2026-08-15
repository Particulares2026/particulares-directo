export const PROVINCIAS = [
  "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
  "Badajoz", "Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
  "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada",
  "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Jaén", "La Rioja",
  "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia",
  "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca",
  "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona",
  "Teruel", "Toledo", "Valencia", "Valladolid", "Bizkaia", "Zamora",
  "Zaragoza", "Ceuta", "Melilla",
];

export const TIPOS_INMUEBLE: { valor: string; label: string }[] = [
  { valor: "piso", label: "Piso" },
  { valor: "casa", label: "Casa" },
  { valor: "habitacion", label: "Habitación" },
  { valor: "garaje", label: "Garaje" },
  { valor: "trastero", label: "Trastero" },
  { valor: "local", label: "Local" },
  { valor: "terreno", label: "Terreno" },
  { valor: "edificio", label: "Edificio" },
];

export const OPERACIONES: { valor: string; label: string }[] = [
  { valor: "venta", label: "Venta" },
  { valor: "alquiler", label: "Alquiler" },
];

export const CARACTERISTICAS: { valor: string; label: string }[] = [
  { valor: "aire_acondicionado", label: "Aire acondicionado" },
  { valor: "armarios_empotrados", label: "Armarios empotrados" },
  { valor: "ascensor", label: "Ascensor" },
  { valor: "balcon_terraza", label: "Balcón o terraza" },
  { valor: "calefaccion", label: "Calefacción" },
  { valor: "exterior", label: "Exterior" },
  { valor: "garaje", label: "Garaje" },
  { valor: "jardin", label: "Jardín" },
  { valor: "mascotas", label: "Mascotas" },
  { valor: "piscina", label: "Piscina" },
  { valor: "trastero", label: "Trastero" },
];

export const DURACIONES_ALQUILER: { valor: string; label: string }[] = [
  { valor: "temporada", label: "Alquiler de temporada" },
  { valor: "larga_estancia", label: "Larga estancia" },
];

export const ESTADOS_INMUEBLE: { valor: string; label: string; color: string }[] = [
  { valor: "nuevo", label: "Nuevo", color: "bg-green-500" },
  { valor: "para_entrar", label: "Para entrar", color: "bg-amber-500" },
  { valor: "necesita_reformas", label: "Necesita reformas", color: "bg-red-500" },
];

export const FOTOS_BUCKET = "inmuebles";
export const MAX_FOTOS = 10;

export function extraerPathStorage(url: string): string | null {
  const marker = `/object/public/${FOTOS_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
