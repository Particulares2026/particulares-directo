import { createClient } from "@supabase/supabase-js";
import { esCategoriaValida } from "./categorias";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Referencia = { id: string; categoria: string; tipo: string; activo?: boolean | null };
type Fila = Referencia & { titulo: string };

export async function anunciosRelacionados(actual: Referencia): Promise<{ id: string; titulo: string }[]> {
  if (!UUID.test(actual.id) || !esCategoriaValida(actual.categoria) || actual.activo !== true || !actual.tipo) return [];
  try {
    // Anonymous RLS, even when the page visitor is the owner or administrator.
    const publico = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await publico.from("anuncios")
      .select("id,titulo,categoria,tipo,activo")
      .eq("categoria", actual.categoria).eq("tipo", actual.tipo).eq("activo", true)
      .neq("id", actual.id).order("created_at", { ascending: false }).order("id").limit(4)
      .abortSignal(AbortSignal.timeout(3000));
    if (error) return [];
    const vistos = new Set([actual.id]);
    return ((data || []) as Fila[]).filter(fila => {
      if (!UUID.test(fila.id) || vistos.has(fila.id) || fila.activo !== true || fila.categoria !== actual.categoria
        || fila.tipo !== actual.tipo || typeof fila.titulo !== "string" || !fila.titulo.trim()) return false;
      vistos.add(fila.id);
      return true;
    }).slice(0, 3).map(({ id, titulo }) => ({ id, titulo }));
  } catch { return []; }
}
