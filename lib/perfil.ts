import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function obtenerUsuarioActualizado(user: User): Promise<User> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(user.id);
    if (!error && data.user) return data.user;
  } catch {
    // Si el servicio administrativo no está disponible, se conserva el usuario
    // autenticado para que la página pueda seguir funcionando.
  }

  return user;
}
