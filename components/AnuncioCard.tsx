"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Anuncio = {
  id: string;
  tipo: "busco_empleo" | "ofrezco_empleo";
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  palabras_clave: string[];
  nombre_contacto: string;
  email_contacto: string;
  user_id: string;
};

export default function AnuncioCard({
  anuncio,
  isOwner,
}: {
  anuncio: Anuncio;
  isOwner: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const eliminar = async () => {
    if (!confirm("¿Eliminar este anuncio? No se puede deshacer.")) return;
    setDeleting(true);
    const { error } = await supabase.from("anuncios").delete().eq("id", anuncio.id);
    setDeleting(false);
    if (!error) router.refresh();
  };

  const esOferta = anuncio.tipo === "ofrezco_empleo";

  return (
    <div className="border border-stone-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={
              "text-xs font-medium px-2 py-0.5 rounded-full border " +
              (esOferta
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-teal-50 text-teal-700 border-teal-200")
            }
          >
            {esOferta ? "Ofrece empleo" : "Busca empleo"}
          </span>
          <p className="font-medium text-stone-900 mt-1.5">{anuncio.titulo}</p>
          {anuncio.ubicacion && (
            <p className="text-sm text-stone-500">{anuncio.ubicacion}</p>
          )}
        </div>
        {isOwner && (
          <button
            onClick={eliminar}
            disabled={deleting}
            className="text-xs text-red-500 hover:underline shrink-0 disabled:opacity-40"
          >
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        )}
      </div>

      {anuncio.descripcion && (
        <p className="text-sm text-stone-600 mt-2">{anuncio.descripcion}</p>
      )}

      {anuncio.palabras_clave?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {anuncio.palabras_clave.map((k, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50 text-stone-500"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-stone-400 mt-2">
        Contacto: {anuncio.nombre_contacto} · {anuncio.email_contacto}
      </p>
    </div>
  );
}
