import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const municipiosPorProvincia: Record<string, string[]> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "lib", "municipios.json"), "utf-8")
);

export async function GET(request: Request) {
  const provincia = new URL(request.url).searchParams.get("provincia") || "";
  const municipios = municipiosPorProvincia[provincia] || [];
  return NextResponse.json({ municipios });
}
