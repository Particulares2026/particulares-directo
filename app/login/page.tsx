"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CampoPassword from "@/components/CampoPassword";
import { traducirErrorAuth } from "@/lib/errores-auth";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

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
        <span className="text-3xl">👋</span>
        <h1 className="font-serif text-xl mt-2 mb-1">Entrar</h1>
        <p className="text-sm text-stone-500 mb-6">Accede con tu correo y contraseña.</p>
        <form onSubmit={submit} className="space-y-3">
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
            placeholder="Contraseña"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-lg py-2.5 text-sm font-medium hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-40 shadow-sm"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-sm text-stone-500 mt-4">
          <Link href="/olvide-password" className="text-teal-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p className="text-sm text-stone-500 mt-2">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-teal-700 hover:underline">
            Créala aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
