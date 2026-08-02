"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMensaje("Cuenta creada. Revisa tu correo para confirmar la cuenta antes de entrar.");
  };

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-serif text-xl mb-1">Crear cuenta</h1>
      <p className="text-sm text-stone-500 mb-6">
        Con tu correo y una contraseña podrás publicar y gestionar tus propios anuncios.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          placeholder="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          placeholder="Contraseña (mínimo 6 caracteres)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {mensaje && <p className="text-sm text-teal-700">{mensaje}</p>}
        <button
          disabled={loading}
          className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-40"
        >
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
      <p className="text-sm text-stone-500 mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-teal-700 hover:underline">
          Entra aquí
        </Link>
      </p>
    </main>
  );
}
