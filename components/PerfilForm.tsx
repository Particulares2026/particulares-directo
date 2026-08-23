"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PREFIJOS_TELEFONO, parseTelefono } from "@/lib/telefono";

export default function PerfilForm({
  email,
  nombreInicial,
  telefonoInicial,
}: {
  email: string;
  nombreInicial: string;
  telefonoInicial: string;
}) {
  const router = useRouter();
  const telefono = parseTelefono(telefonoInicial);
  const [nombre, setNombre] = useState(nombreInicial);
  const [prefijoTelefono, setPrefijoTelefono] = useState(telefono.prefijo);
  const [numeroTelefono, setNumeroTelefono] = useState(telefono.numero.replace(/\D/g, ""));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setError(null);

    const response = await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, prefijoTelefono, numeroTelefono }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setGuardando(false);

    if (!response?.ok) {
      setError(data?.error || "No se pudo guardar el perfil. Inténtalo de nuevo.");
      return;
    }

    setMensaje("Perfil actualizado correctamente.");
    router.refresh();
  };

  return (
    <form onSubmit={guardar} className="space-y-4">
      <label className="block text-sm text-stone-700">
        <span className="block mb-1 font-medium">Correo electrónico</span>
        <input
          value={email}
          readOnly
          className="w-full border border-stone-200 bg-stone-50 rounded-lg px-3 py-2.5 text-sm text-stone-500"
        />
        <span className="block mt-1 text-xs text-stone-500">Es el correo confirmado con el que inicias sesión.</span>
      </label>

      <label className="block text-sm text-stone-700">
        <span className="block mb-1 font-medium">Nombre <span className="text-red-600">*</span></span>
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          minLength={2}
          maxLength={100}
          required
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </label>

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-stone-700">
          Teléfono <span className="text-red-600">*</span>
        </legend>
        <div className="flex gap-2">
          <select
            aria-label="Prefijo telefónico"
            value={prefijoTelefono}
            onChange={(event) => setPrefijoTelefono(event.target.value)}
            className="w-28 shrink-0 border border-stone-300 rounded-lg px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            {PREFIJOS_TELEFONO.map((prefijo) => (
              <option key={prefijo.codigo} value={prefijo.codigo}>
                {prefijo.codigo} {prefijo.pais}
              </option>
            ))}
          </select>
          <input
            aria-label="Número de teléfono"
            type="tel"
            inputMode="numeric"
            pattern="\d{6,12}"
            value={numeroTelefono}
            onChange={(event) => setNumeroTelefono(event.target.value.replace(/\D/g, ""))}
            required
            className="min-w-0 flex-1 border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
        <p className="mt-1 text-xs text-stone-500">
          Se usará como valor inicial al publicar. Solo será público si eliges mostrarlo en el anuncio.
        </p>
      </fieldset>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {mensaje && <p role="status" className="text-sm text-teal-700">{mensaje}</p>}

      <button
        disabled={guardando}
        className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 py-2.5 text-sm font-medium text-white shadow-sm hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-40"
      >
        {guardando ? "Guardando…" : "Guardar perfil"}
      </button>
    </form>
  );
}
