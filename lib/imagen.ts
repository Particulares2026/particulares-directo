const TAMANO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.8;
const TIEMPO_MAXIMO_COMPRESION = 15_000;
const TIEMPO_MAXIMO_CONVERSION_HEIC = 45_000;

function extensionArchivo(nombre: string) {
  return nombre.split(".").pop()?.toLowerCase() ?? "";
}

function mensajeFormatoNoCompatible(file: File) {
  const extension = extensionArchivo(file.name);
  if (file.type.includes("heic") || file.type.includes("heif") || extension === "heic" || extension === "heif") {
    return "No se pudo convertir esta foto HEIC/HEIF. Prueba a guardarla como JPG e inténtalo de nuevo.";
  }
  return "El navegador no puede leer esta imagen. Utiliza una foto JPG, PNG, WEBP o GIF.";
}

function nombreComoJpeg(nombre: string) {
  const base = nombre.replace(/\.[^.]+$/, "").trim();
  return `${base || "foto"}.jpg`;
}

function conCancelacionYLimite<T>(
  promesa: Promise<T>,
  signal: AbortSignal | undefined,
  milisegundos: number,
  mensajeLimite: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    let finalizado = false;

    const limpiar = () => {
      window.clearTimeout(temporizador);
      signal?.removeEventListener("abort", cancelar);
    };
    const terminar = (valor: T) => {
      if (finalizado) return;
      finalizado = true;
      limpiar();
      resolve(valor);
    };
    const fallar = (error: unknown) => {
      if (finalizado) return;
      finalizado = true;
      limpiar();
      reject(error);
    };
    const cancelar = () => fallar(new DOMException("La preparación de la foto se canceló.", "AbortError"));
    const temporizador = window.setTimeout(() => fallar(new Error(mensajeLimite)), milisegundos);

    signal?.addEventListener("abort", cancelar, { once: true });
    if (signal?.aborted) {
      cancelar();
      return;
    }

    promesa.then(terminar, fallar);
  });
}

async function cabeceraPareceHeic(file: File) {
  const extension = extensionArchivo(file.name);
  if (file.type.includes("heic") || file.type.includes("heif") || extension === "heic" || extension === "heif") {
    return true;
  }

  try {
    const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    const texto = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return texto.slice(4, 8) === "ftyp" && /(heic|heix|hevc|hevx|heim|heis|mif1|msf1)/.test(texto.slice(8));
  } catch {
    return false;
  }
}

async function convertirHeic(file: File, signal?: AbortSignal): Promise<File | null> {
  const convertir = async () => {
    const { heicTo, isHeic } = await import("heic-to/csp");
    if (!(await isHeic(file))) return null;

    const blob = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.9,
    });
    return new File([blob], nombreComoJpeg(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  };

  try {
    return await conCancelacionYLimite(
      convertir(),
      signal,
      TIEMPO_MAXIMO_CONVERSION_HEIC,
      "La conversión de la foto HEIC tardó demasiado. Prueba con una versión JPG de menor tamaño."
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof Error && error.message.startsWith("La conversión de la foto HEIC")) throw error;
    throw new Error("No se pudo convertir esta foto HEIC/HEIF. Prueba a guardarla como JPG e inténtalo de nuevo.");
  }
}

function comprimirConCanvas(file: File, signal?: AbortSignal): Promise<File> {

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    let finalizado = false;

    const limpiar = () => {
      window.clearTimeout(temporizador);
      URL.revokeObjectURL(url);
      img.onload = null;
      img.onerror = null;
      signal?.removeEventListener("abort", cancelar);
    };

    const terminar = (resultado: File) => {
      if (finalizado) return;
      finalizado = true;
      limpiar();
      resolve(resultado);
    };

    const fallar = (mensaje: string) => {
      if (finalizado) return;
      finalizado = true;
      limpiar();
      reject(new Error(mensaje));
    };

    const cancelar = () => {
      if (finalizado) return;
      finalizado = true;
      limpiar();
      reject(new DOMException("La preparación de la foto se canceló.", "AbortError"));
    };

    const temporizador = window.setTimeout(
      () => fallar("La foto tardó demasiado en prepararse. Prueba con una versión JPG de menor tamaño."),
      TIEMPO_MAXIMO_COMPRESION
    );
    signal?.addEventListener("abort", cancelar, { once: true });

    if (signal?.aborted) {
      cancelar();
      return;
    }

    img.onload = () => {
      if (finalizado) return;
      const escala = Math.min(1, TAMANO_MAXIMO / Math.max(img.width, img.height));
      const ancho = Math.round(img.width * escala);
      const alto = Math.round(img.height * escala);

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        fallar("No se pudo preparar la foto en este navegador.");
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, ancho, alto);
      ctx.drawImage(img, 0, 0, ancho, alto);
      canvas.toBlob(
        (blob) => {
          if (finalizado) return;
          if (!blob) {
            fallar("No se pudo convertir la foto a un formato compatible.");
            return;
          }
          const nombre = nombreComoJpeg(file.name);
          terminar(new File([blob], nombre, { type: "image/jpeg" }));
        },
        "image/jpeg",
        CALIDAD_JPEG
      );
    };

    img.onerror = () => {
      fallar(mensajeFormatoNoCompatible(file));
    };

    img.src = url;
  });
}

export async function comprimirImagen(file: File, signal?: AbortSignal): Promise<File> {
  const extension = extensionArchivo(file.name);
  const pareceImagen = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(extension);
  if (!pareceImagen || file.type === "image/svg+xml" || extension === "svg") {
    throw new Error("El archivo no es una imagen JPG, PNG, WEBP, GIF, HEIC o HEIF válida.");
  }

  const posibleHeic = await cabeceraPareceHeic(file);
  if (posibleHeic) {
    const convertido = await convertirHeic(file, signal);
    if (convertido) return comprimirConCanvas(convertido, signal);
  }

  try {
    return await comprimirConCanvas(file, signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;

    // Algunos iPhone entregan archivos HEIC sin extensión ni MIME correctos.
    // Si el navegador no los entiende, comprobamos el contenido antes de descartarlos.
    if (!posibleHeic) {
      const convertido = await convertirHeic(file, signal);
      if (convertido) return comprimirConCanvas(convertido, signal);
    }
    throw error;
  }
}

