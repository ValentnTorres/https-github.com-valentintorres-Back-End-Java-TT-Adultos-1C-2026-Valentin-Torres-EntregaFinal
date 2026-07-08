// URL base del backend. Como el backend corre en un puerto distinto
// al del frontend, necesitamos la URL completa (no alcanza con rutas
// relativas) y el backend tiene que tener CORS habilitado para este
// origen (ver CorsConfig.java).
export const API_BASE_URL = "http://localhost:8080/api";

// Wrapper generico sobre fetch. Lo usan todos los archivos de esta
// carpeta (usuariosApi.js, proyectosApi.js, tareasApi.js) para no
// repetir el manejo de errores en cada llamada.
export async function apiFetch(path, options = {}) {
  const respuesta = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // El backend devuelve 204 (sin body) en los DELETE. En ese caso no
  // hay nada para parsear como JSON.
  if (respuesta.status === 204) {
    return null;
  }

  const data = await respuesta.json();

  if (!respuesta.ok) {
    // El GlobalExceptionHandler del backend siempre responde con un
    // objeto { mensajes: [...] } cuando hay un error. Lo convertimos
    // en un Error de JS para que lo capture el componente que llamo.
    const mensaje = data.mensajes ? data.mensajes.join(", ") : "Error inesperado";
    throw new Error(mensaje);
  }

  return data;
}
