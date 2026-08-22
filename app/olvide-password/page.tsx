"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { traducirErrorAuth } from "@/lib/errores-auth";
import Turnstile from "@/components/Turnstile";

export default function OlvidePasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);

    if (!captchaToken) {
      setLoading(false);
      setError("Completa la verificación de seguridad antes de continuar.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer-password`,
      captchaToken,
    });

    setLoading(false);
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
    if (error) {
      setError(traducirErrorAuth(error.message));
      return;
    }
    setMensaje(
      "Si ese correo tiene una cuenta, te hemos enviado un enlace para restablecer la contraseña. Revisa también la carpeta de spam o correo no deseado, a veces llega ahí."
    );
  };

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-md border border-fuchsia-100 p-6">
      <span className="text-3xl">🔑</span>
      <h1 className="font-serif text-xl mt-2 mb-1">Recuperar contraseña</h1>
      <p className="text-sm text-stone-500 mb-6">
        Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          placeholder="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Turnstile onVerify={setCaptchaToken} resetKey={captchaResetKey} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {mensaje && <p className="text-sm text-teal-700">{mensaje}</p>}
        <button
          disabled={loading}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg py-2.5 text-sm font-medium hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-40 shadow-sm"
        >
          {loading ? "Enviando…" : "Enviar enlace"}
        </button>
      </form>
      <p className="text-sm text-stone-500 mt-4">
        <Link href="/login" className="text-teal-700 hover:underline">
          Volver a entrar
        </Link>
      </p>
      </div>
    </main>
  );
}
