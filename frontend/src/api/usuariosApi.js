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
