export function esOrigenPermitido(request: Request) {
  const origen = request.headers.get("origin");
  if (!origen) return request.headers.get("sec-fetch-site") !== "cross-site";

  try {
    return new URL(origen).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

