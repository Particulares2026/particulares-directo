"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { etiquetasTipo } from "@/lib/categorias";
import {
  PROVINCIAS,
  TIPOS_INMUEBLE,
  OPERACIONES,
  CARACTERISTICAS,
  DURACIONES_ALQUILER,
  ESTADOS_INMUEBLE,
  MAX_FOTOS,
} from "@/lib/inmobiliaria";
import {
  SECTORES_TRABAJO,
  MODALIDADES_TRABAJO,
  EXPERIENCIA_TRABAJO,
  SALARIO_PERIODOS,
  IDIOMAS_TRABAJO,
  CARACTERISTICAS_TRABAJO,
} from "@/lib/trabajo";
import { PREFIJOS_TELEFONO, parseTelefono } from "@/lib/telefono";
import { comprimirImagen } from "@/lib/imagen";
import AsistenteCurriculum from "@/components/AsistenteCurriculum";
import AnuncioCard from "@/components/AnuncioCard";

const SelectorUbicacion = dynamic(() => import("@/components/mapa/SelectorUbicacion"), {
  ssr: false,
  loading: () => <div className="h-[260px] rounded-lg border border-stone-200 bg-stone-50 animate-pulse" />,
});

function Seccion({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide pt-2">{children}</p>
  );
}

type AnuncioExistente = {
  id: string;
  tipo?: "busco" | "ofrezco";
  titulo?: string;
  ubicacion?: string | null;
  palabras_clave?: string[];
  descripcion?: string | null;
  nombre_contacto?: string;
  telefono_contacto?: string | null;
  mostrar_telefono?: boolean;
  mostrar_email?: boolean;
  operacion?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  tipo_inmueble?: string | null;
  precio?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  amueblado?: boolean | null;
  tamano?: number | null;
  caracteristicas?: string[];
  duracion_alquiler?: string | null;
  fotos?: string[];
  estado?: string | null;
  lat?: number | null;
  lng?: number | null;
  sector_trabajo?: string | null;
  modalidad_trabajo?: string | null;
  salario_min?: number | null;
  salario_max?: number | null;
  salario_periodo?: string | null;
  experiencia_trabajo?: string | null;
  idiomas_trabajo?: string[];
  incorporacion?: string | null;
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
  const router = useRouter();
  const esInmobiliaria = categoria === "inmobiliaria";
  const esTrabajo = categoria === "trabajo";
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
  const [mostrarTelefono, setMostrarTelefono] = useState(anuncioExistente?.mostrar_telefono ?? true);
  const [mostrarEmail, setMostrarEmail] = useState(anuncioExistente?.mostrar_email ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [operacion, setOperacion] = useState(anuncioExistente?.operacion ?? "venta");
  const [provincia, setProvincia] = useState(anuncioExistente?.provincia ?? "");
  const [municipio, setMunicipio] = useState(anuncioExistente?.municipio ?? "");
  const [municipiosDisponibles, setMunicipiosDisponibles] = useState<string[]>([]);
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
  const [estado, setEstado] = useState(anuncioExistente?.estado ?? "");
  const [lat, setLat] = useState<number | null>(anuncioExistente?.lat ?? null);
  const [lng, setLng] = useState<number | null>(anuncioExistente?.lng ?? null);
  const [mapaAbierto, setMapaAbierto] = useState(Boolean(anuncioExistente?.lat && anuncioExistente?.lng));
  const [fotos, setFotos] = useState<string[]>(anuncioExistente?.fotos ?? []);
  const [subiendoFotos, setSubiendoFotos] = useState(false);
  const [fotosError, setFotosError] = useState<string | null>(null);
  const [fotoArrastrada, setFotoArrastrada] = useState<number | null>(null);

  const [sectorTrabajo, setSectorTrabajo] = useState(anuncioExistente?.sector_trabajo ?? "");
  const [modalidadTrabajo, setModalidadTrabajo] = useState(anuncioExistente?.modalidad_trabajo ?? "");
  const [salarioMin, setSalarioMin] = useState(
    anuncioExistente?.salario_min != null ? String(anuncioExistente.salario_min) : ""
  );
  const [salarioMax, setSalarioMax] = useState(
    anuncioExistente?.salario_max != null ? String(anuncioExistente.salario_max) : ""
  );
  const [salarioPeriodo, setSalarioPeriodo] = useState(anuncioExistente?.salario_periodo ?? "");
  const [experienciaTrabajo, setExperienciaTrabajo] = useState(anuncioExistente?.experiencia_trabajo ?? "");
  const [idiomasTrabajo, setIdiomasTrabajo] = useState<string[]>(anuncioExistente?.idiomas_trabajo ?? []);
  const [incorporacion, setIncorporacion] = useState(anuncioExistente?.incorporacion ?? "");
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);

  useEffect(() => {
    if (!(esInmobiliaria || esTrabajo) || !provincia) {
      setMunicipiosDisponibles([]);
      return;
    }
    let cancelado = false;
    fetch(`/api/municipios?provincia=${encodeURIComponent(provincia)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelado) setMunicipiosDisponibles(data.municipios || []);
      });
    return () => {
      cancelado = true;
    };
  }, [provincia, esInmobiliaria, esTrabajo]);

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

  const toggleIdioma = (valor: string) => {
    setIdiomasTrabajo((prev) =>
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

    const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (files.some((f) => !TIPOS_PERMITIDOS.includes(f.type))) {
      setFotosError("Solo se admiten imágenes JPG, PNG, WEBP o GIF.");
      e.target.value = "";
      return;
    }

    setFotosError(null);
    setSubiendoFotos(true);
    const nuevas: string[] = [];
    let ultimoError: string | null = null;
    try {
      for (const file of files) {
        const comprimido = await comprimirImagen(file);
        const formData = new FormData();
        formData.append("foto", comprimido);
        const res = await fetch("/api/anuncios/fotos", { method: "POST", body: formData });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.url) {
          ultimoError = data?.error || "No se pudo subir la foto.";
          continue;
        }
        nuevas.push(data.url);
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
    const res = await fetch("/api/anuncios/fotos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setFotos((prev) => (prev.includes(url) ? prev : [...prev, url]));
      setFotosError(data?.error || "No se pudo eliminar la foto.");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mostrarTelefono && !mostrarEmail) {
      setError("Elige al menos un medio de contacto: teléfono, email, o ambos.");
      return;
    }

    const numeroLimpio = numeroTelefono.trim();
    if (mostrarTelefono && !/^\d{6,12}$/.test(numeroLimpio)) {
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
      telefono_contacto: mostrarTelefono ? `${prefijoTelefono} ${numeroLimpio}` : null,
      email_contacto: defaultEmail,
      mostrar_telefono: mostrarTelefono,
      mostrar_email: mostrarEmail,
      operacion: esInmobiliaria ? operacion : null,
      provincia: esInmobiliaria || esTrabajo ? provincia || null : null,
      municipio: esInmobiliaria || esTrabajo ? municipio || null : null,
      tipo_inmueble: esInmobiliaria ? tipoInmueble : null,
      precio: esInmobiliaria && precio ? Number(precio) : null,
      habitaciones: esInmobiliaria && habitaciones ? Number(habitaciones) : null,
      banos: esInmobiliaria && banos ? Number(banos) : null,
      amueblado: esInmobiliaria && amueblado ? amueblado === "si" : null,
      tamano: esInmobiliaria && tamano ? Number(tamano) : null,
      caracteristicas: esInmobiliaria ? caracteristicas : esTrabajo ? caracteristicas : [],
      duracion_alquiler: esInmobiliaria && operacion === "alquiler" && duracionAlquiler ? duracionAlquiler : null,
      fotos,
      estado: esInmobiliaria && estado ? estado : null,
      lat: esInmobiliaria ? lat : null,
      lng: esInmobiliaria ? lng : null,
      sector_trabajo: esTrabajo ? sectorTrabajo || null : null,
      modalidad_trabajo: esTrabajo ? modalidadTrabajo || null : null,
      salario_min: esTrabajo && salarioMin ? Number(salarioMin) : null,
      salario_max: esTrabajo && salarioMax ? Number(salarioMax) : null,
      salario_periodo: esTrabajo ? salarioPeriodo || null : null,
      experiencia_trabajo: esTrabajo ? experienciaTrabajo || null : null,
      idiomas_trabajo: esTrabajo ? idiomasTrabajo : [],
      incorporacion: esTrabajo ? incorporacion || null : null,
    };

    const res = await fetch("/api/anuncios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: anuncioExistente?.id, ...payload }),
    });
    const data = await res.json().catch(() => null);

    setLoading(false);
    if (!res.ok) {
      setError(data?.error || "No se pudo guardar el anuncio. Inténtalo de nuevo.");
      return;
    }
    router.push("/mis-anuncios");
    router.refresh();
  };

  const previewAnuncio = {
    id: anuncioExistente?.id ?? "preview",
    categoria,
    tipo,
    titulo: titulo.trim() || "Título del anuncio",
    descripcion: descripcion.trim() || null,
    ubicacion: ubicacion.trim() || null,
    palabras_clave: palabrasClave
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    nombre_contacto: nombreContacto.trim() || "Tú",
    telefono_contacto: numeroTelefono.trim() ? `${prefijoTelefono} ${numeroTelefono.trim()}` : null,
    email_contacto: defaultEmail,
    mostrar_telefono: mostrarTelefono,
    mostrar_email: mostrarEmail,
    user_id: userId,
    operacion: esInmobiliaria ? operacion : null,
    provincia: esInmobiliaria || esTrabajo ? provincia || null : null,
    municipio: esInmobiliaria || esTrabajo ? municipio || null : null,
    tipo_inmueble: esInmobiliaria ? tipoInmueble : null,
    precio: esInmobiliaria && precio ? Number(precio) : null,
    precio_anterior: null,
    habitaciones: esInmobiliaria && habitaciones ? Number(habitaciones) : null,
    banos: esInmobiliaria && banos ? Number(banos) : null,
    amueblado: esInmobiliaria && amueblado ? amueblado === "si" : null,
    tamano: esInmobiliaria && tamano ? Number(tamano) : null,
    caracteristicas: esInmobiliaria ? caracteristicas : esTrabajo ? caracteristicas : [],
    duracion_alquiler: esInmobiliaria && operacion === "alquiler" && duracionAlquiler ? duracionAlquiler : null,
    fotos,
    estado: esInmobiliaria && estado ? estado : null,
    destacado_hasta: null,
    sector_trabajo: esTrabajo ? sectorTrabajo || null : null,
    modalidad_trabajo: esTrabajo ? modalidadTrabajo || null : null,
    salario_min: esTrabajo && salarioMin ? Number(salarioMin) : null,
    salario_max: esTrabajo && salarioMax ? Number(salarioMax) : null,
    salario_periodo: esTrabajo ? salarioPeriodo || null : null,
    experiencia_trabajo: esTrabajo ? experienciaTrabajo || null : null,
    idiomas_trabajo: esTrabajo ? idiomasTrabajo : [],
    incorporacion: esTrabajo ? incorporacion || null : null,
  };

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start">
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
          <Seccion>Datos del inmueble</Seccion>

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
              onChange={(e) => {
                setProvincia(e.target.value);
                setMunicipio("");
              }}
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
          {provincia && (
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              disabled={municipiosDisponibles.length === 0}
            >
              <option value="">
                {municipiosDisponibles.length === 0 ? "Cargando municipios…" : "Municipio (opcional)"}
              </option>
              {municipiosDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
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
              placeholder="Habitaciones"
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
            <option value="">Amueblado o sin amueblar (opcional)</option>
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
            <p className="text-sm text-stone-500 mb-1.5">Estado del inmueble (opcional)</p>
            <div className="flex gap-2">
              {ESTADOS_INMUEBLE.map((e) => (
                <button
                  key={e.valor}
                  type="button"
                  onClick={() => setEstado((prev) => (prev === e.valor ? "" : e.valor))}
                  className={
                    "flex-1 flex items-center justify-center gap-1 text-center leading-tight px-1 py-2 text-sm rounded-lg border " +
                    (estado === e.valor
                      ? "border-stone-900 bg-stone-50 text-stone-900 font-medium"
                      : "border-stone-200 text-stone-500")
                  }
                >
                  <span className={"w-2.5 h-2.5 rounded-full shrink-0 " + e.color} aria-hidden="true" />
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-stone-500 mb-1.5">Características (opcional)</p>
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

          <Seccion>Ubicación</Seccion>

          <input
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Barrio o zona (opcional)"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />

          {mapaAbierto ? (
            <div>
              <p className="text-sm text-stone-500 mb-1.5">Ubicación en el mapa (opcional)</p>
              <SelectorUbicacion lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMapaAbierto(true)}
              className="text-sm text-teal-700 hover:underline"
            >
              📍 Añadir ubicación en el mapa (opcional)
            </button>
          )}
        </>
      )}

      {esTrabajo && (
        <>
          <Seccion>Datos del empleo (opcional)</Seccion>

          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            value={sectorTrabajo}
            onChange={(e) => setSectorTrabajo(e.target.value)}
          >
            <option value="">Sector</option>
            {SECTORES_TRABAJO.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={provincia}
              onChange={(e) => {
                setProvincia(e.target.value);
                setMunicipio("");
              }}
            >
              <option value="">Provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {provincia && (
              <select
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                disabled={municipiosDisponibles.length === 0}
              >
                <option value="">
                  {municipiosDisponibles.length === 0 ? "Cargando…" : "Municipio"}
                </option>
                {municipiosDisponibles.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>

          <select
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
            value={modalidadTrabajo}
            onChange={(e) => setModalidadTrabajo(e.target.value)}
          >
            <option value="">Contrato</option>
            {MODALIDADES_TRABAJO.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Salario mín. (€)"
              type="number"
              min="0"
              value={salarioMin}
              onChange={(e) => setSalarioMin(e.target.value)}
            />
            <input
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              placeholder="Salario máx. (€)"
              type="number"
              min="0"
              value={salarioMax}
              onChange={(e) => setSalarioMax(e.target.value)}
            />
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={salarioPeriodo}
              onChange={(e) => setSalarioPeriodo(e.target.value)}
            >
              <option value="">Periodo</option>
              {SALARIO_PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={experienciaTrabajo}
              onChange={(e) => setExperienciaTrabajo(e.target.value)}
            >
              <option value="">Experiencia</option>
              {EXPERIENCIA_TRABAJO.map((ex) => (
                <option key={ex.valor} value={ex.valor}>
                  {ex.label}
                </option>
              ))}
            </select>
            <select
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              value={incorporacion}
              onChange={(e) => setIncorporacion(e.target.value)}
            >
              <option value="">Incorporación</option>
              <option value="inmediata">Inmediata</option>
              <option value="convenir">A convenir</option>
            </select>
          </div>

          <div>
            <p className="text-sm text-stone-500 mb-1.5">Idiomas</p>
            <div className="flex flex-wrap gap-1.5">
              {IDIOMAS_TRABAJO.map((idioma) => (
                <button
                  key={idioma}
                  type="button"
                  onClick={() => toggleIdioma(idioma)}
                  className={
                    "text-xs px-2.5 py-1.5 rounded-full border " +
                    (idiomasTrabajo.includes(idioma)
                      ? "border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700 font-medium"
                      : "border-stone-200 text-stone-500")
                  }
                >
                  {idioma}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-stone-500 mb-1.5">Características</p>
            <div className="flex flex-wrap gap-1.5">
              {CARACTERISTICAS_TRABAJO.map((c) => (
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

      <Seccion>Fotos</Seccion>

      <div>
        <p className="text-sm text-stone-500 mb-1.5">
          {fotos.length}/{MAX_FOTOS}
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
                <img src={url} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-lg border border-stone-200" />
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
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={subiendoFotos}
            onChange={handleFotosChange}
          />
        )}
        {subiendoFotos && <p className="text-xs text-stone-400 mt-1">Subiendo fotos…</p>}
        {fotosError && <p className="text-xs text-red-600 mt-1">{fotosError}</p>}
      </div>

      <Seccion>Detalles adicionales{esInmobiliaria || esTrabajo ? " (opcional)" : ""}</Seccion>

      {!esInmobiliaria && !esTrabajo && (
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          placeholder="Ciudad o modalidad (ej. Sevilla, remoto)"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          required
        />
      )}
      {esTrabajo && (
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          placeholder="Barrio o zona (opcional)"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
        />
      )}
      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder={esInmobiliaria || esTrabajo ? "Palabras clave separadas por comas (opcional)" : "Palabras clave separadas por comas"}
        value={palabrasClave}
        onChange={(e) => setPalabrasClave(e.target.value)}
        required={!esInmobiliaria && !esTrabajo}
      />
      {esTrabajo && tipo === "busco" && !asistenteAbierto && (
        <button
          type="button"
          onClick={() => setAsistenteAbierto(true)}
          className="text-sm text-teal-700 hover:underline"
        >
          ✨ Ayúdame a redactar mi anuncio
        </button>
      )}

      {esTrabajo && tipo === "busco" && asistenteAbierto && (
        <AsistenteCurriculum
          onGenerar={(texto) => {
            setDescripcion(texto);
            setAsistenteAbierto(false);
          }}
          onCerrar={() => setAsistenteAbierto(false)}
        />
      )}

      <textarea
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
        rows={3}
        placeholder={esInmobiliaria || esTrabajo ? "Descripción (opcional)" : "Descripción"}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        required={!esInmobiliaria && !esTrabajo}
      />

      {esTrabajo && tipo === "busco" && (
        <p className="text-xs text-stone-400">
          ¿Quieres además un currículum en PDF para entregar en mano? Puedes crear uno gratis en{" "}
          <a
            href="https://europass.europa.eu/es/create-europass-cv"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-600"
          >
            Europass
          </a>
          , la herramienta oficial de la Unión Europea.
        </p>
      )}

      <Seccion>Contacto</Seccion>

      <input
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        placeholder="Nombre de contacto"
        value={nombreContacto}
        onChange={(e) => setNombreContacto(e.target.value)}
        required
      />

      <div>
        <p className="text-sm text-stone-500 mb-1.5">¿Cómo prefieres que te contacten?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMostrarTelefono((v) => !v)}
            aria-pressed={mostrarTelefono}
            className={
              "flex-1 text-sm py-2 rounded-lg border " +
              (mostrarTelefono
                ? "border-teal-700 bg-teal-50 text-teal-800 font-medium"
                : "border-stone-200 text-stone-500")
            }
          >
            📞 Teléfono
          </button>
          <button
            type="button"
            onClick={() => setMostrarEmail((v) => !v)}
            aria-pressed={mostrarEmail}
            className={
              "flex-1 text-sm py-2 rounded-lg border " +
              (mostrarEmail
                ? "border-teal-700 bg-teal-50 text-teal-800 font-medium"
                : "border-stone-200 text-stone-500")
            }
          >
            ✉️ Email
          </button>
        </div>
      </div>

      {mostrarTelefono && (
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
      )}

      {mostrarEmail && (
        <p className="text-sm text-stone-500 border border-stone-200 rounded-lg px-3 py-2 bg-stone-50">
          Se mostrará tu email de cuenta: <span className="font-medium text-stone-700">{defaultEmail}</span>
        </p>
      )}
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

    <aside className="hidden lg:block sticky top-20">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Vista previa</p>
      <AnuncioCard anuncio={previewAnuncio} isOwner={false} />
    </aside>
    </div>
  );
}

