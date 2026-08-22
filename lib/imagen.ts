const TAMANO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.8;
const TIEMPO_MAXIMO_COMPRESION = 15_000;

function extensionArchivo(nombre: string) {
  return nombre.split(".").pop()?.toLowerCase() ?? "";
}

function mensajeFormatoNoCompatible(file: File) {
  const extension = extensionArchivo(file.name);
  if (file.type === "image/heic" || file.type === "image/heif" || extension === "heic" || extension === "heif") {
    return "La foto está en formato HEIC/HEIF y este navegador no puede convertirla. Guárdala o compártela como JPG e inténtalo de nuevo.";
  }
  return "El navegador no puede leer esta imagen. Utiliza una foto JPG, PNG, WEBP o GIF.";
}

export function comprimirImagen(file: File, signal?: AbortSignal): Promise<File> {
  const extension = extensionArchivo(file.name);
  const pareceImagen = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(extension);
  if (!pareceImagen || file.type === "image/svg+xml" || extension === "svg") {
    return Promise.reject(new Error("El archivo no es una imagen JPG, PNG, WEBP o GIF válida."));
  }

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
          const nombre = file.name.replace(/\.\w+$/, "") + ".jpg";
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

