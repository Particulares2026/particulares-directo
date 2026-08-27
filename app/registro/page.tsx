"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PREFIJOS_TELEFONO } from "@/lib/telefono";
import CampoPassword from "@/components/CampoPassword";
import Turnstile from "@/components/Turnstile";
import { traducirErrorAuth } from "@/lib/errores-auth";
import { CONSENTIMIENTO_LEGAL_REGISTRO } from "@/lib/legal";

export default function RegistroPage() {
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [prefijoTelefono, setPrefijoTelefono] = useState("+34");
  const [numeroTelefono, setNumeroTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
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
    if (!aceptaPrivacidad) {
      setError("Tienes que aceptar el aviso legal y los términos y condiciones para crear una cuenta.");
      return;
    }
    if (!captchaToken) {
      setError("Completa la verificación de seguridad antes de continuar.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          telefono: `${prefijoTelefono} ${numeroLimpio}`,
          consentimiento_legal: CONSENTIMIENTO_LEGAL_REGISTRO,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken,
      },
    });

    setLoading(false);
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
    if (error) {
      setError(traducirErrorAuth(error.message));
      return;
    }
    setMensaje("Cuenta creada. Revisa tu correo para confirmar la cuenta antes de entrar.");
  };

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-md border border-fuchsia-100 p-6">
      <span className="text-3xl">✨</span>
      <h1 className="font-serif text-xl mt-2 mb-1">Crear cuenta</h1>
      <p className="text-sm text-stone-500 mb-6">
        El correo y el teléfono son obligatorios para proteger la confianza entre anunciantes.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm text-stone-700">
          <span className="block mb-1 font-medium">Nombre <span className="text-red-600">*</span></span>
          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-stone-700">
            Teléfono <span className="text-red-600">*</span>
          </legend>
          <div className="flex gap-2">
            <select
              aria-label="Prefijo telefónico"
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
              aria-label="Número de teléfono"
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
          <p className="mt-1 text-xs text-stone-500">No se mostrará en un anuncio salvo que tú lo elijas.</p>
        </fieldset>
        <label className="block text-sm text-stone-700">
          <span className="block mb-1 font-medium">Correo electrónico <span className="text-red-600">*</span></span>
          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            placeholder="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm text-stone-700">
          <span className="block mb-1 font-medium">Contraseña <span className="text-red-600">*</span></span>
          <CampoPassword
            value={password}
            onChange={setPassword}
            placeholder="Mínimo 10 caracteres"
            minLength={10}
            required
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={aceptaPrivacidad}
            onChange={(e) => setAceptaPrivacidad(e.target.checked)}
          />
          <span>
            He leído y acepto el{" "}
            <Link href="/aviso-legal" target="_blank" className="text-teal-700 hover:underline">
              aviso legal y la política de privacidad
            </Link>{" "}
            y los{" "}
            <Link href="/terminos" target="_blank" className="text-teal-700 hover:underline">
              términos y condiciones de uso
            </Link>
            .
          </span>
        </label>
        <Turnstile onVerify={setCaptchaToken} resetKey={captchaResetKey} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {mensaje && <p className="text-sm text-teal-700">{mensaje}</p>}
        <button
          disabled={loading}
          className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg py-2.5 text-sm font-medium hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-40 shadow-sm"
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
      </div>
    </main>
  );
}
