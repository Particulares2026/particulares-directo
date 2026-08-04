"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { etiquetasTipo } from "@/lib/categorias";
import {
  PROVINCIAS,
  TIPOS_INMUEBLE,
  OPERACIONES,
  CARACTERISTICAS,
  DURACIONES_ALQUILER,
  FOTOS_BUCKET,
  MAX_FOTOS,
  extraerPathStorage,
} from "@/lib/inmobiliaria";
import { PREFIJOS_TELEFONO, parseTelefono } from "@/lib/telefono";

type AnuncioExistente = {
  id: string;
  tipo?: "busco" | "ofrezco";
  titulo?: string;
  ubicacion?: string | null;
  palabras_clave?: string[];
  descripcion?: string | null;
  nombre_contacto?: string;
  telefono_contacto?: string | null;
  operacion?: string | null;
  provincia?: string | null;
  tipo_inmueble?: string | null;
  precio?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  amueblado?: boolean | null;
  tamano?: number | null;
  caracteristicas?: string[];
  duracion_alquiler?: string | null;
  fotos?: string[];
};

export default function AnuncioForm({
  userId,
  categoria,
  defaultNombre,
  defaultTelefono,
  defaultEmail,
  anuncioExistente,
}: {
  userId: string;
  categoria: string;
  defaultNombre: string;
  defaultTelefono: string;
  defaultEmail: string;
  anuncioExistente?: AnuncioExistente;
}) {
  const supabase = createClient();
  const router = useRouter();
  const esInmobiliaria = categoria === "inmobiliaria";
  const esEdicion = Boolean(anuncioExistente);

  const [tipo, setTipo] = useState<"busco" | "ofrezco">(anuncioExistente?.tipo ?? "busco");
  const [etiquetaBusco, etiquetaOfrezco] = etiquetasTipo(categoria);
  const [titulo, setTitulo] = useState(anuncioExistente?.titulo ?? "");
  const [ubicacion, setUbicacion] = useState(anuncioExistente?.ubicacion ?? "");
  const [palabrasClave, setPalabrasClave] = useState((anuncioExistente?.palabras_clave ?? []).join(", "));
  const [descripcion, setDescripcion] = useState(anuncioExistente?.descripcion ?? "");
  const [nombreContacto, setNombreContacto] = useState(anuncioExistente?.nombre_contacto ?? defaultNombre);
  const telefonoInicial = parseTelefono(anuncioExistente?.telefono_contacto ?? defaultTelefono);
  const [prefijoTelefono, setPrefijoTelefono] = useState(telefonoInicial.prefijo);
  const [numeroTelefono, setNumeroTelefono] = useState(telefonoInicial.numero);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [operacion, setOperacion] = useState(anuncioExistente?.operacion ?? "venta");
  const [provincia, setProvincia] = useState(anuncioExistente?.provincia ?? "");
  const [tipoInmueble, setTipoInmueble] = useState(anuncioExistente?.tipo_inmueble ?? "piso");
  const [precio, setPrecio] = useState(anuncioExistente?.precio != null ? String(anuncioExistente.precio) : "");
  const [habitaciones, setHabitaciones] = useState(
    anuncioExistente?.habitaciones != null ? String(anuncioExistente.habitaciones) : ""
  );
  const [banos, setBanos] = useState(anuncioExistente?.banos != null ? String(anuncioExistente.banos) : "");
  const [amueblado, setAmueblado] = useState(
    anuncioExistente?.amueblado == null ? "" : anuncioExistente.amueblado ? "si" : "no"
  );
  const [tamano, setTamano] = useState(anuncioExistente?.tamano != null ? String(anuncioExistente.tamano) : "");
  const [caracteristicas, setCaracteristicas] = useState<string[]>(anuncioExistente?.caracteristicas ?? []);
  const [duracionAlquiler, setDuracionAlquiler] = useState(anuncioExistente?.duracion_alquiler ?? "");
  const [fotos, setFotos] = useState<string[]>(anuncioExistente?.fotos ?? []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [fotosError, setFotosError] = useState<string | null>(null);
  const [fotoArrastrada, setFotoArrastrada] = useState<number | null>(null);

  const moverFoto = (destino: number) => {
    if (fotoArrastrada === null || fotoArrastrada === destino) return;
    setFotos((prev) => {
      const siguiente = [...prev];
      const [movida] = siguiente.splice(fotoArrastrada, 1);
      siguiente.splice(destino, 0, movida);
      return siguiente;
    });
    setFotoArrastrada(null);
  };

  const toggleCaracteristica = (valor: string) => {
    setCaracteristicas((prev) =>
      prev.includes(valor) ? prev.filter((c) => c !== valor) : [...prev, valor]
    );
  };

  const handleFotosChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (fotos.length + files.length > MAX_FOTOS) {
      setFotosError(`Puedes subir un máximo de ${MAX_FOTOS} fotos.`);
      e.target.value = "";
      return;
    }

    setFotosError(null);
    setSubiendoFotos(true);
    const nuevas: string[] = [];
    let ultimoError: string | null = null;
    try {
      for (const file of files) {
        const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await supabase.storage.from(FOTOS_BUCKET).upload(path, file);
        if (uploadError) {
          ultimoError = uploadError.message;
          continue;
        }
        const { data } = supabase.storage.from(FOTOS_BUCKET).getPublicUrl(path);
        nuevas.push(data.publicUrl);
      }
    } catch (err: any) {
      ultimoError = err?.message || "Error inesperado al subir la foto.";
    }
    setFotos((prev) => [...prev, ...nuevas]);
    if (ultimoError) setFotosError(ultimoError);
    setSubiendoFotos(false);
    e.target.value = "";
  };

  const eliminarFoto = async (url: string) => {
    setFotos((prev) => prev.filter((f) => f !== url));
    const path = extraerPathStorage(url);
    if (path) await supabase.storage.from(FOTOS_BUCKET).remove([path]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const numeroLimpio = numeroTelefono.trim();
    if (!/^\d{6,12}$/.test(numeroLimpio)) {
      setError("Introduce un número de teléfono completo (solo dígitos, 6 a 12 números).");
      return;
    }

    setLoading(true);

    const payload = {
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
      telefono_contacto: `${prefijoTelefono} ${numeroLimpio}`,
      email_contacto: defaultEmail,
      operacion: esInmobiliaria ? operacion : null,
      provincia: esInmobiliaria ? provincia || null : null,
      tipo_inmueble: esInmobiliaria ? tipoInmueble : null,
      precio: esInmobiliaria && precio ? Number(precio) : null,
      habitaciones: esInmobiliaria && habitaciones ? Number(habitaciones) : null,
      banos: esInmobiliaria && banos ? Number(banos) : null,
      amueblado: esInmobiliaria ? amueblado === "si" : null,
      tamano: esInmobiliaria && tamano ? Number(tamano) : null,
      caracteristicas: esInmobiliaria ? caracteristicas : [],
      duracion_alquiler: esInmobiliaria && operacion === "alquiler" && duracionAlquiler ? duracionAlquiler : null,
      fotos: esInmobiliaria ? fotos : [],
    };

    const { error } = anuncioExistente
      ? await supabase.from("anuncios").update(payload).eq("id", anuncioExistente.id)
      : await supabase.from("anuncios").insert({ user_id: userId, ...payload });

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
              required
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
              required
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Nº Habitaciones"
              type="number"
              min="0"
              value={habitaciones}
              onChange={(e) => setHabitaciones(e.target.value)}
              required
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Nº Baños"
              type="number"
              min="0"
              value={banos}
              onChange={(e) => setBanos(e.target.value)}
              required
            />
          </div>
          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Tamaño (m²)"
            type="number"
            min="0"
            value={tamano}
            onChange={(e) => setTamano(e.target.value)}
            required
          />
          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            value={amueblado}
            onChange={(e) => setAmueblado(e.target.value)}
            required
          >
            <option value="" disabled>Amueblado o sin amueblar</option>
            <option value="si">Amueblado</option>
            <option value="no">Sin amueblar</option>
          </select>

          {operacion === "alquiler" && (
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={duracionAlquiler}
              onChange={(e) => setDuracionAlquiler(e.target.value)}
              required
            >
              <option value="" disabled>Temporada o larga estancia</option>
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

          <div>
            <p className="text-sm text-stone-500 mb-1.5">
              Fotos ({fotos.length}/{MAX_FOTOS})
            </p>
            {fotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                {fotos.map((url, i) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => setFotoArrastrada(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      moverFoto(i);
                    }}
                    onDragEnd={() => setFotoArrastrada(null)}
                    className={
                      "relative cursor-move " + (fotoArrastrada === i ? "opacity-40" : "")
                    }
                  >
                    <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg border border-stone-200" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-stone-900/80 text-white">
                        Portada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => eliminarFoto(url)}
                      aria-label="Quitar foto"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-900 text-white text-xs leading-none flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fotos.length > 1 && (
              <p className="text-xs text-stone-400 mb-2">Arrastra las fotos para cambiar el orden.</p>
            )}
            {fotos.length < MAX_FOTOS && (
              <input
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-stone-100 file:text-stone-700"
                type="file"
                accept="image/*"
                multiple
                disabled={subiendoFotos}
                onChange={handleFotosChange}
              />
            )}
            {subiendoFotos && <p className="text-xs text-stone-400 mt-1">Subiendo fotos…</p>}
            {fotosError && <p className="text-xs text-red-600 mt-1">{fotosError}</p>}
          </div>
        </>
      )}

      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Ciudad o modalidad (ej. Sevilla, remoto)"
        value={ubicacion}
        onChange={(e) => setUbicacion(e.target.value)}
        required
      />
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Palabras clave separadas por comas"
        value={palabrasClave}
        onChange={(e) => setPalabrasClave(e.target.value)}
        required
      />
      <textarea
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
        rows={3}
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        required
      />
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Nombre de contacto"
        value={nombreContacto}
        onChange={(e) => setNombreContacto(e.target.value)}
        required
      />
      <div className="flex gap-2">
        <select
          className="w-28 shrink-0 border border-stone-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
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
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          placeholder="Número de teléfono de contacto"
          type="tel"
          inputMode="numeric"
          pattern="\d{6,12}"
          value={numeroTelefono}
          onChange={(e) => setNumeroTelefono(e.target.value.replace(/[^0-9]/g, ""))}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={loading || subiendoFotos}
        className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-800 disabled:opacity-40"
      >
        {loading
          ? esEdicion
            ? "Guardando…"
            : "Publicando…"
          : esEdicion
          ? "Guardar cambios"
          : "Publicar anuncio"}
      </button>
    </form>
  );
}
