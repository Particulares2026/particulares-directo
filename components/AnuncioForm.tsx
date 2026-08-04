"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { etiquetasTipo } from "@/lib/categorias";

export default function AnuncioForm({
  userId,
  categoria,
  defaultNombre,
  defaultEmail,
}: {
  userId: string;
  categoria: string;
  defaultNombre: string;
  defaultEmail: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [tipo, setTipo] = useState<"busco" | "ofrezco">("busco");
  const [etiquetaBusco, etiquetaOfrezco] = etiquetasTipo(categoria);
  const [titulo, setTitulo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [palabrasClave, setPalabrasClave] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreContacto, setNombreContacto] = useState(defaultNombre);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("anuncios").insert({
      user_id: userId,
      categoria,
      tipo,
      titulo: titulo.trim(),
      ubicacion: ubicacion.trim(),
      descripcion: descripcion.trim(),
      palabras_clave: palabrasClave
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      nombre_contacto: nombreContacto.trim(),
      email_contacto: defaultEmail,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/mis-anuncios");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTipo("busco")}
          className={
            "flex-1 text-sm py-2 rounded-lg border " +
            (tipo === "busco"
              ? "border-teal-700 bg-teal-50 text-teal-800 font-medium"
              : "border-stone-200 text-stone-500")
          }
        >
          {etiquetaBusco}
        </button>
        <button
          type="button"
          onClick={() => setTipo("ofrezco")}
          className={
            "flex-1 text-sm py-2 rounded-lg border " +
            (tipo === "ofrezco"
              ? "border-amber-600 bg-amber-50 text-amber-700 font-medium"
              : "border-stone-200 text-stone-500")
          }
        >
          {etiquetaOfrezco}
        </button>
      </div>
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Título del anuncio"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
      />
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Ciudad o modalidad (ej. Sevilla, remoto)"
        value={ubicacion}
        onChange={(e) => setUbicacion(e.target.value)}
      />
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Palabras clave separadas por comas"
        value={palabrasClave}
        onChange={(e) => setPalabrasClave(e.target.value)}
      />
      <textarea
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
        rows={3}
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Nombre de contacto"
        value={nombreContacto}
        onChange={(e) => setNombreContacto(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={loading}
        className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-40"
      >
        {loading ? "Publicando…" : "Publicar anuncio"}
      </button>
    </form>
  );
}
