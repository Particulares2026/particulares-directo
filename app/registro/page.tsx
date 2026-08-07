"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PREFIJOS_TELEFONO } from "@/lib/telefono";
import CampoPassword from "@/components/CampoPassword";
import { traducirErrorAuth } from "@/lib/errores-auth";

export default function RegistroPage() {
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [prefijoTelefono, setPrefijoTelefono] = useState("+34");
  const [numeroTelefono, setNumeroTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    const numeroLimpio = numeroTelefono.trim();
    if (!/^\d{6,12}$/.test(numeroLimpio)) {
      setError("Introduce un número de teléfono completo (solo dígitos, 6 a 12 números).");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, telefono: `${prefijoTelefono} ${numeroLimpio}` },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(traducirErrorAuth(error.message));
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
        <div className="flex gap-2">
          <select
            className="w-28 shrink-0 border border-stone-300 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            value={prefijoTelefono}
            onChange={(e) => setPrefijoTelefono(e.target.value)}
            required
          >
            {PREFIJOS_TELEFONO.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.codigo} {p.pais}
              </option>
            ))}
          </select>
          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            placeholder="Número de teléfono"
            type="tel"
            inputMode="numeric"
            pattern="\d{6,12}"
            value={numeroTelefono}
            onChange={(e) => setNumeroTelefono(e.target.value.replace(/[^0-9]/g, ""))}
            required
          />
        </div>
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          placeholder="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <CampoPassword
          value={password}
          onChange={setPassword}
          placeholder="Contraseña (mínimo 6 caracteres)"
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
