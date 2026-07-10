// El backend manda las fechas en formato ISO (YYYY-MM-DD). En toda la
// app se muestran en formato DD/MM/YYYY en vez de eso.
export function formatearFecha(fechaIso) {
  const [anio, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}/${anio}`;
}

// Calcula, a partir de la fechaLimite de una tarea, cuantos dias
// faltan y que variante visual usar (vencida / proxima / normal).
// Una tarea en una columna final (ej. "Completada") nunca se marca
// como vencida: ya no tiene sentido avisar sobre una fecha limite de
// algo que terminó.
export function calcularEstadoFecha(fechaLimite, columnaEsFinal) {
  if (!fechaLimite) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaLimite + "T00:00:00");
  const diffDias = Math.round((limite - hoy) / (1000 * 60 * 60 * 24));

  if (columnaEsFinal) {
    return { texto: `Vencía: ${formatearFecha(fechaLimite)}`, variante: "normal" };
  }
  if (diffDias < 0) {
    return { texto: `Vencida hace ${Math.abs(diffDias)}d`, variante: "vencida" };
  }
  if (diffDias === 0) {
    return { texto: "Vence hoy", variante: "proxima" };
  }
  if (diffDias <= 2) {
    return { texto: `Vence en ${diffDias}d`, variante: "proxima" };
  }
  return { texto: `Vence: ${formatearFecha(fechaLimite)}`, variante: "normal" };
}
