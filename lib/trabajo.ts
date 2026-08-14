// Lista única y en orden alfabético (con "Otros" siempre al final).
export const SECTORES_TRABAJO: { valor: string; label: string }[] = [
  { valor: "administracion_oficina", label: "Administración / oficina" },
  { valor: "albanileria", label: "Albañilería" },
  { valor: "atencion_cliente", label: "Atención al cliente" },
  { valor: "hosteleria_camarero", label: "Camarero/a y hostelería" },
  { valor: "carpinteria", label: "Carpintería" },
  { valor: "cerrajeria", label: "Cerrajería" },
  { valor: "climatizacion", label: "Climatización y aire acondicionado" },
  { valor: "cocina", label: "Cocina" },
  { valor: "comercial_ventas", label: "Comercial y ventas" },
  { valor: "conduccion_transporte", label: "Conducción y transporte" },
  { valor: "cuidado_ninos", label: "Cuidado de niños / canguro" },
  { valor: "cuidado_mayores", label: "Cuidado de personas mayores o dependientes" },
  { valor: "electricidad", label: "Electricidad" },
  { valor: "fontaneria", label: "Fontanería" },
  { valor: "jardineria", label: "Jardinería" },
  { valor: "domestico_limpieza", label: "Limpieza y servicio doméstico" },
  { valor: "logistica_almacen", label: "Logística y almacén" },
  { valor: "mecanica", label: "Mecánica" },
  { valor: "peluqueria_estetica", label: "Peluquería y estética" },
  { valor: "pintura", label: "Pintura" },
  { valor: "reformas", label: "Reformas generales" },
  { valor: "repartidor", label: "Repartidor/a" },
  { valor: "seguridad", label: "Seguridad" },
  { valor: "soldadura", label: "Soldadura" },
  { valor: "turismo_temporal", label: "Turismo / extranjeros" },
  { valor: "otros", label: "Otros" },
];

export const MODALIDADES_TRABAJO: { valor: string; label: string }[] = [
  { valor: "interna", label: "Interna" },
  { valor: "externa", label: "Externa" },
  { valor: "por_horas", label: "Por horas" },
  { valor: "completa", label: "Jornada completa" },
  { valor: "media", label: "Media jornada" },
  { valor: "temporal", label: "Temporal / fines de semana" },
];

export const EXPERIENCIA_TRABAJO: { valor: string; label: string }[] = [
  { valor: "no_requerida", label: "No requerida" },
  { valor: "algo", label: "Algo de experiencia" },
  { valor: "demostrable", label: "Experiencia demostrable" },
];

export const SALARIO_PERIODOS: { valor: string; label: string }[] = [
  { valor: "hora", label: "€/hora" },
  { valor: "dia", label: "€/día" },
  { valor: "mes", label: "€/mes" },
  { valor: "convenir", label: "A convenir" },
];

export const IDIOMAS_TRABAJO: string[] = [
  "Español", "Inglés", "Francés", "Alemán", "Italiano", "Árabe", "Rumano", "Chino", "Otro",
];

export const CARACTERISTICAS_TRABAJO: { valor: string; label: string }[] = [
  { valor: "alojamiento_incluido", label: "Alojamiento incluido" },
  { valor: "vehiculo_propio", label: "Vehículo propio" },
  { valor: "carnet_conducir", label: "Carnet de conducir" },
  { valor: "contrato_legal", label: "Contrato legal" },
  { valor: "referencias_disponibles", label: "Referencias disponibles" },
];

export function nombreSector(valor: string | null | undefined): string {
  return SECTORES_TRABAJO.find((s) => s.valor === valor)?.label ?? "";
}

export function nombreModalidad(valor: string | null | undefined): string {
  return MODALIDADES_TRABAJO.find((m) => m.valor === valor)?.label ?? "";
}

export function nombreExperiencia(valor: string | null | undefined): string {
  return EXPERIENCIA_TRABAJO.find((e) => e.valor === valor)?.label ?? "";
}

export function textoSalario(
  min: number | null | undefined,
  max: number | null | undefined,
  periodo: string | null | undefined
): string {
  if (periodo === "convenir" || (!min && !max)) return "Salario a convenir";
  const unidad =
    (periodo && SALARIO_PERIODOS.find((p) => p.valor === periodo && p.valor !== "convenir")?.label) || "€";
  if (min && max && min !== max) return `${min.toLocaleString("es-ES")}-${max.toLocaleString("es-ES")} ${unidad}`;
  const valor = min || max;
  return `${valor!.toLocaleString("es-ES")} ${unidad}`;
}
