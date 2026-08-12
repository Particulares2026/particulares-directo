import { NextResponse } from "next/server";
import municipiosPorProvincia from "@/lib/municipios.json";

export async function GET(request: Request) {
  const provincia = new URL(request.url).searchParams.get("provincia") || "";
  const municipios = (municipiosPorProvincia as Record<string, string[]>)[provincia] || [];
  return NextResponse.json({ municipios });
}
