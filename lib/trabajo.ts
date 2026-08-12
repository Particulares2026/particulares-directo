export const SECTORES_TRABAJO: { valor: string; label: string }[] = [
  { valor: "domestico_limpieza", label: "Servicio doméstico y limpieza" },
  { valor: "cuidado_mayores", label: "Cuidado de personas mayores o dependientes" },
  { valor: "cuidado_ninos", label: "Cuidado de niños / canguro" },
  { valor: "hosteleria_camarero", label: "Hostelería y camarero/a" },
  { valor: "cocina", label: "Cocina" },
  { valor: "oficios", label: "Oficios (carpintería, pintura, fontanería, electricidad...)" },
  { valor: "turismo_temporal", label: "Turismo / trabajo temporal para extranjeros" },
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
  { valor: "incorporacion_inmediata", label: "Incorporación inmediata" },
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
  const sufijo = periodo && periodo !== "convenir" ? ` ${SALARIO_PERIODOS.find((p) => p.valor === periodo)?.label ?? ""}` : "";
  if (periodo === "convenir" || (!min && !max)) return "Salario a convenir";
  if (min && max && min !== max) return `${min.toLocaleString("es-ES")}-${max.toLocaleString("es-ES")} €${sufijo}`;
  const valor = min || max;
  return `${valor!.toLocaleString("es-ES")} €${sufijo}`;
}
