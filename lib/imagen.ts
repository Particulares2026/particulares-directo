const TAMANO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.8;
const TIEMPO_MAXIMO_COMPRESION = 15_000;

export function comprimirImagen(file: File, signal?: AbortSignal): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return Promise.resolve(file);
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

    const cancelar = () => {
      if (finalizado) return;
      finalizado = true;
      limpiar();
      reject(new DOMException("La preparación de la foto se canceló.", "AbortError"));
    };

    const temporizador = window.setTimeout(() => terminar(file), TIEMPO_MAXIMO_COMPRESION);
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
        terminar(file);
        return;
      }

      ctx.drawImage(img, 0, 0, ancho, alto);
      canvas.toBlob(
        (blob) => {
          if (finalizado) return;
          if (!blob) {
            terminar(file);
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
      terminar(file);
    };

    img.src = url;
  });
}

