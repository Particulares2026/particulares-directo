"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import CampoPassword from "@/components/CampoPassword";

export default function RestablecerPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/restablecer-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "No se pudo cambiar la contraseña. Solicita un enlace nuevo.");
        return;
      }

      router.replace("/mis-anuncios");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
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
