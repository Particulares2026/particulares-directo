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
  { valor: "exterior", label: "Exterior" },
  { valor: "garaje", label: "Garaje" },
  { valor: "jardin", label: "Jardín" },
  { valor: "piscina", label: "Piscina" },
  { valor: "trastero", label: "Trastero" },
];

export const DURACIONES_ALQUILER: { valor: string; label: string }[] = [
  { valor: "temporada", label: "Alquiler de temporada" },
  { valor: "larga_estancia", label: "Larga estancia" },
];
