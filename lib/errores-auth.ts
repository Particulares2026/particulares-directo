export function traducirErrorAuth(mensaje: string): string {
  const espera = mensaje.match(/after (\d+) seconds?/i);
  if (espera) {
    return `Por seguridad, espera ${espera[1]} segundos antes de volver a intentarlo.`;
  }
  if (/invalid login credentials/i.test(mensaje)) {
    return "Correo o contraseña incorrectos.";
  }
  if (/user already registered/i.test(mensaje)) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (/email not confirmed/i.test(mensaje)) {
    return "Todavía no has confirmado tu correo. Revisa tu bandeja de entrada (y spam).";
  }
  return mensaje;
}
