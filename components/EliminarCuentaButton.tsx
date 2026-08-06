"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EliminarCuentaButton() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminar = async () => {
    if (
      !confirm(
        "¿Seguro que quieres eliminar tu cuenta? Se borrarán también todos tus anuncios y fotos. No se puede deshacer."
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/eliminar-cuenta", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar la cuenta.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mt-10 pt-6 border-t border-stone-100">
      <button
        type="button"
        onClick={eliminar}
        disabled={loading}
        className="text-sm text-red-600 hover:underline disabled:opacity-40"
      >
        {loading ? "Eliminando cuenta…" : "Eliminar mi cuenta"}
      </button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
