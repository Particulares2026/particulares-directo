"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CampoPassword from "@/components/CampoPassword";
import { traducirErrorAuth } from "@/lib/errores-auth";

export default function RestablecerPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesionValida, setSesionValida] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (activo) setSesionValida(Boolean(data.user));
      })
      .catch(() => {
        if (activo) setSesionValida(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(traducirErrorAuth(error.message));
      return;
    }
    router.push("/mis-anuncios");
    router.refresh();
  };

  if (sesionValida === null) {
    return (
      <main className="max-w-sm mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-md border border-fuchsia-100 p-6 text-sm text-stone-500">
          Comprobando el enlace…
        </div>
      </main>
    );
  }

  if (!sesionValida) {
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

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-md border border-fuchsia-100 p-6">
      <span className="text-3xl">🔒</span>
      <h1 className="font-serif text-xl mt-2 mb-1">Crear nueva contraseña</h1>
      <p className="text-sm text-stone-500 mb-6">Elige una contraseña nueva para tu cuenta.</p>
      <form onSubmit={submit} className="space-y-3">
        <CampoPassword
          value={password}
          onChange={setPassword}
          placeholder="Contraseña nueva (mínimo 10 caracteres)"
          minLength={10}
          required
        />
        <CampoPassword
          value={confirmar}
          onChange={setConfirmar}
          placeholder="Repite la contraseña"
          minLength={10}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg py-2.5 text-sm font-medium hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-40 shadow-sm"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
      </div>
    </main>
  );
}

