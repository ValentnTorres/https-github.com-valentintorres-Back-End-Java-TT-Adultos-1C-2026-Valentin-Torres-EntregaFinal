// Funciones que hablan con /api/usuarios en el backend.
// Cada una arma la request y le delega a apiFetch el fetch en si.
import { apiFetch } from "./config";

export function listarUsuarios() {
  return apiFetch("/usuarios");
}

export function crearUsuario(usuario) {
  return apiFetch("/usuarios", {
    method: "POST",
    body: JSON.stringify(usuario),
  });
}

export function actualizarUsuario(id, usuario) {
  return apiFetch(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(usuario),
  });
}

export function eliminarUsuario(id) {
  return apiFetch(`/usuarios/${id}`, { method: "DELETE" });
}

// Solo la puede llamar un ADMIN (el backend responde 403 si no).
export function cambiarRolUsuario(id, rol) {
  return apiFetch(`/usuarios/${id}/rol`, {
    method: "PUT",
    body: JSON.stringify({ rol }),
  });
}

// Idem: asigna a un USER el PM cuyo equipo va a integrar. Solo ADMIN.
export function asignarUsuarioAPm(id, pmId) {
  return apiFetch(`/usuarios/${id}/pm`, {
    method: "PUT",
    body: JSON.stringify({ pmId }),
  });
}

// Lista de usuarios "visibles" para el que pregunta, ya filtrada por
// rol del lado del backend: se usa para el selector de "asignar a una
// tarea" en TareasPage (reemplaza a listarUsuarios(), que solo ADMIN
// puede llamar).
export function obtenerEquipo() {
  return apiFetch("/usuarios/equipo");
}
