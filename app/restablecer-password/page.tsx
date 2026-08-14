"use client";

import { useState, type FormEvent } from "react";
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
          placeholder="Contraseña nueva (mínimo 6 caracteres)"
          minLength={6}
          required
        />
        <CampoPassword
          value={confirmar}
          onChange={setConfirmar}
          placeholder="Repite la contraseña"
          minLength={6}
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
