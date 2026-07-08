// Funciones que hablan con /api/proyectos en el backend.
import { apiFetch } from "./config";

export function listarProyectos() {
  return apiFetch("/proyectos");
}

export function crearProyecto(proyecto) {
  return apiFetch("/proyectos", {
    method: "POST",
    body: JSON.stringify(proyecto),
  });
}

export function actualizarProyecto(id, proyecto) {
  return apiFetch(`/proyectos/${id}`, {
    method: "PUT",
    body: JSON.stringify(proyecto),
  });
}

export function eliminarProyecto(id) {
  return apiFetch(`/proyectos/${id}`, { method: "DELETE" });
}
