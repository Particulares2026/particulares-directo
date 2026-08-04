"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { etiquetasTipo } from "@/lib/categorias";
import { PROVINCIAS, TIPOS_INMUEBLE, OPERACIONES, CARACTERISTICAS, DURACIONES_ALQUILER } from "@/lib/inmobiliaria";

export default function AnuncioForm({
  userId,
  categoria,
  defaultNombre,
  defaultTelefono,
  defaultEmail,
}: {
  userId: string;
  categoria: string;
  defaultNombre: string;
  defaultTelefono: string;
  defaultEmail: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const esInmobiliaria = categoria === "inmobiliaria";

  const [tipo, setTipo] = useState<"busco" | "ofrezco">("busco");
  const [etiquetaBusco, etiquetaOfrezco] = etiquetasTipo(categoria);
  const [titulo, setTitulo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [palabrasClave, setPalabrasClave] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreContacto, setNombreContacto] = useState(defaultNombre);
  const [telefonoContacto, setTelefonoContacto] = useState(defaultTelefono);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [operacion, setOperacion] = useState("venta");
  const [provincia, setProvincia] = useState("");
  const [tipoInmueble, setTipoInmueble] = useState("piso");
  const [precio, setPrecio] = useState("");
  const [habitaciones, setHabitaciones] = useState("");
  const [banos, setBanos] = useState("");
  const [amueblado, setAmueblado] = useState("sin_dato");
  const [tamano, setTamano] = useState("");
  const [caracteristicas, setCaracteristicas] = useState<string[]>([]);
  const [duracionAlquiler, setDuracionAlquiler] = useState("");

  const toggleCaracteristica = (valor: string) => {
    setCaracteristicas((prev) =>
      prev.includes(valor) ? prev.filter((c) => c !== valor) : [...prev, valor]
    );
  };

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
      telefono_contacto: telefonoContacto.trim(),
      email_contacto: defaultEmail,
      operacion: esInmobiliaria ? operacion : null,
      provincia: esInmobiliaria ? provincia || null : null,
      tipo_inmueble: esInmobiliaria ? tipoInmueble : null,
      precio: esInmobiliaria && precio ? Number(precio) : null,
      habitaciones: esInmobiliaria && habitaciones ? Number(habitaciones) : null,
      banos: esInmobiliaria && banos ? Number(banos) : null,
      amueblado: esInmobiliaria && amueblado !== "sin_dato" ? amueblado === "si" : null,
      tamano: esInmobiliaria && tamano ? Number(tamano) : null,
      caracteristicas: esInmobiliaria ? caracteristicas : [],
      duracion_alquiler: esInmobiliaria && operacion === "alquiler" && duracionAlquiler ? duracionAlquiler : null,
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

      {esInmobiliaria && (
        <div className="flex gap-2">
          {OPERACIONES.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => setOperacion(o.valor)}
              className={
                "flex-1 text-sm py-2 rounded-lg border " +
                (operacion === o.valor
                  ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium"
                  : "border-stone-200 text-stone-500")
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Título del anuncio"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
      />

      {esInmobiliaria && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={tipoInmueble}
              onChange={(e) => setTipoInmueble(e.target.value)}
            >
              {TIPOS_INMUEBLE.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              required
            >
              <option value="">Provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Precio (€)"
              type="number"
              min="0"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Nº Habitaciones"
              type="number"
              min="0"
              value={habitaciones}
              onChange={(e) => setHabitaciones(e.target.value)}
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Nº Baños"
              type="number"
              min="0"
              value={banos}
              onChange={(e) => setBanos(e.target.value)}
            />
          </div>
          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Tamaño (m²)"
            type="number"
            min="0"
            value={tamano}
            onChange={(e) => setTamano(e.target.value)}
          />
          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            value={amueblado}
            onChange={(e) => setAmueblado(e.target.value)}
          >
            <option value="sin_dato">Amueblado: sin especificar</option>
            <option value="si">Amueblado</option>
            <option value="no">Sin amueblar</option>
          </select>

          {operacion === "alquiler" && (
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={duracionAlquiler}
              onChange={(e) => setDuracionAlquiler(e.target.value)}
            >
              <option value="">Duración del alquiler: sin especificar</option>
              {DURACIONES_ALQUILER.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.label}
                </option>
              ))}
            </select>
          )}

          <div>
            <p className="text-sm text-stone-500 mb-1.5">Características</p>
            <div className="flex flex-wrap gap-1.5">
              {CARACTERISTICAS.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => toggleCaracteristica(c.valor)}
                  className={
                    "text-xs px-2.5 py-1.5 rounded-full border " +
                    (caracteristicas.includes(c.valor)
                      ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium"
                      : "border-stone-200 text-stone-500")
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Número de teléfono de contacto"
        type="tel"
        value={telefonoContacto}
        onChange={(e) => setTelefonoContacto(e.target.value)}
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
