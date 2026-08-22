// Columnas que pueden salir de Supabase hacia visitantes y usuarios normales.
// Los datos de contacto se excluyen deliberadamente: solo se leen con la clave
// de servicio después de comprobar el propietario o aplicar el límite de revelado.
// Se mantiene como literal para que Supabase y TypeScript puedan validar en la
// compilación la forma exacta del resultado de las consultas.
export const CAMPOS_PUBLICOS_ANUNCIO =
  "id,user_id,categoria,tipo,titulo,descripcion,ubicacion,palabras_clave,nombre_contacto,mostrar_telefono,mostrar_email,created_at,operacion,provincia,municipio,tipo_inmueble,precio,precio_anterior,habitaciones,banos,amueblado,tamano,caracteristicas,duracion_alquiler,fotos,estado,lat,lng,sector_trabajo,modalidad_trabajo,salario_min,salario_max,salario_periodo,experiencia_trabajo,idiomas_trabajo,incorporacion,activo,fecha_activacion,destacado_hasta";
