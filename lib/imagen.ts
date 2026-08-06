const TAMANO_MAXIMO = 1600;
const CALIDAD_JPEG = 0.8;

export function comprimirImagen(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const escala = Math.min(1, TAMANO_MAXIMO / Math.max(img.width, img.height));
      const ancho = Math.round(img.width * escala);
      const alto = Math.round(img.height * escala);

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, ancho, alto);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const nombre = file.name.replace(/\.\w+$/, "") + ".jpg";
          resolve(new File([blob], nombre, { type: "image/jpeg" }));
        },
        "image/jpeg",
        CALIDAD_JPEG
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
