// Funciones que hablan con /api/tareas en el backend, incluyendo los
// dos endpoints extra para asignar/desasignar usuarios (relacion
// ManyToMany entre Tarea y Usuario).
import { apiFetch } from "./config";

export function listarTareas() {
  return apiFetch("/tareas");
}

export function crearTarea(tarea) {
  return apiFetch("/tareas", {
    method: "POST",
    body: JSON.stringify(tarea),
  });
}

export function actualizarTarea(id, tarea) {
  return apiFetch(`/tareas/${id}`, {
    method: "PUT",
    body: JSON.stringify(tarea),
  });
}

export function eliminarTarea(id) {
  return apiFetch(`/tareas/${id}`, { method: "DELETE" });
}

export function asignarUsuarioATarea(tareaId, usuarioId) {
  return apiFetch(`/tareas/${tareaId}/usuarios/${usuarioId}`, {
    method: "POST",
  });
}

export function desasignarUsuarioDeTarea(tareaId, usuarioId) {
  return apiFetch(`/tareas/${tareaId}/usuarios/${usuarioId}`, {
    method: "DELETE",
  });
}
