import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_RECUPERACION_PASSWORD = "pd_recuperacion_password";
export const SEGUNDOS_RECUPERACION_PASSWORD = 15 * 60;

function firmar(contenido: string) {
  const secreto = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secreto) return null;
  return createHmac("sha256", secreto).update(contenido).digest("base64url");
}

export function crearMarcaRecuperacion(userId: string) {
  const caduca = Math.floor(Date.now() / 1000) + SEGUNDOS_RECUPERACION_PASSWORD;
  const contenido = `${userId}.${caduca}`;
  const firma = firmar(contenido);
  return firma ? `${contenido}.${firma}` : null;
}

export function validarMarcaRecuperacion(marca: string | undefined, userId: string) {
  if (!marca) return false;

  const [idMarcado, caducaTexto, firmaRecibida, ...resto] = marca.split(".");
  if (resto.length || idMarcado !== userId || !/^\d+$/.test(caducaTexto || "")) return false;

  const caduca = Number(caducaTexto);
  const ahora = Math.floor(Date.now() / 1000);
  if (caduca <= ahora || caduca > ahora + SEGUNDOS_RECUPERACION_PASSWORD) return false;

  const firmaEsperada = firmar(`${idMarcado}.${caducaTexto}`);
  if (!firmaEsperada || !firmaRecibida) return false;

  const esperada = Buffer.from(firmaEsperada);
  const recibida = Buffer.from(firmaRecibida);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}
