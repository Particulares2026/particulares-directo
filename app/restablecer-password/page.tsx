import Link from "next/link";
import { cookies } from "next/headers";
import RestablecerPasswordForm from "@/components/RestablecerPasswordForm";
import { createClient } from "@/lib/supabase/server";
import {
  COOKIE_RECUPERACION_PASSWORD,
  validarMarcaRecuperacion,
} from "@/lib/recuperacion-password";

export const dynamic = "force-dynamic";

export default async function RestablecerPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const marca = (await cookies()).get(COOKIE_RECUPERACION_PASSWORD)?.value;
  const enlaceValido = Boolean(user && validarMarcaRecuperacion(marca, user.id));

  if (!enlaceValido) {
    return (
      <main className="max-w-sm mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-md border border-fuchsia-100 p-6">
          <span className="text-3xl">🔒</span>
          <h1 className="font-serif text-xl mt-2 mb-1">El enlace no es válido</h1>
          <p className="text-sm text-stone-500 mb-5">
            Puede haber caducado o haberse utilizado ya. Solicita un enlace nuevo para continuar.
          </p>
          <Link
            href="/olvide-password"
            className="block w-full text-center bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg py-2.5 text-sm font-medium"
          >
            Solicitar otro enlace
          </Link>
        </div>
      </main>
    );
  }

  return <RestablecerPasswordForm />;
}
