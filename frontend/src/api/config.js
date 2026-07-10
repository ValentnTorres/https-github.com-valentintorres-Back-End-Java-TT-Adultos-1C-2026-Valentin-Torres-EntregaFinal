// URL base del backend. Como el backend corre en un origen distinto al
// del frontend, necesitamos la URL completa (no alcanza con rutas
// relativas) y el backend tiene que tener CORS habilitado para este
// origen (ver CorsConfig.java).
//
// VITE_API_BASE_URL se define al buildear el frontend (Vite solo expone
// las variables que empiezan con VITE_). En Railway se configura como
// variable de entorno del servicio del frontend, apuntando a la URL
// publica del servicio del backend. En local, sin esa variable, sigue
// apuntando a localhost:8080 como siempre.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

// Clave unica de localStorage donde se guarda { token, usuario } tras
// el login (ver authApi.js).
const CLAVE_SESION = "sesion";

export function obtenerSesion() {
  const guardada = localStorage.getItem(CLAVE_SESION);
  return guardada ? JSON.parse(guardada) : null;
}

export function guardarSesion(sesion) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

export function borrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}

// Wrapper generico sobre fetch. Lo usan todos los archivos de esta
// carpeta (usuariosApi.js, proyectosApi.js, tareasApi.js, authApi.js)
// para no repetir el manejo de errores en cada llamada.
export async function apiFetch(path, options = {}) {
  const sesion = obtenerSesion();

  const respuesta = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(sesion ? { Authorization: `Bearer ${sesion.token}` } : {}),
    },
    ...options,
  });

  // Token vencido/invalido: se corta la sesion y se vuelve a mostrar
  // el login (App la va a mostrar sola porque ya no hay nada guardado).
  if (respuesta.status === 401 && sesion) {
    borrarSesion();
    window.location.reload();
    return null;
  }

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
