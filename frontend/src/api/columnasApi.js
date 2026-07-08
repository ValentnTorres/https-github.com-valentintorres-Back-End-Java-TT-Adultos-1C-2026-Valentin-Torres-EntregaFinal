// Funciones que hablan con /api/columnas: las columnas del tablero
// Kanban (equivalentes a las "listas" de Trello). A diferencia de
// Proyecto/Usuario, tambien exponen un endpoint para reordenar todo
// el tablero de una sola vez.
import { apiFetch } from "./config";

export function listarColumnas() {
  return apiFetch("/columnas");
}

export function crearColumna(columna) {
  return apiFetch("/columnas", {
    method: "POST",
    body: JSON.stringify(columna),
  });
}

export function actualizarColumna(id, columna) {
  return apiFetch(`/columnas/${id}`, {
    method: "PUT",
    body: JSON.stringify(columna),
  });
}

export function eliminarColumna(id) {
  return apiFetch(`/columnas/${id}`, { method: "DELETE" });
}

// idsEnOrden: array de ids de columna en el nuevo orden, de izquierda a derecha.
export function reordenarColumnas(idsEnOrden) {
  return apiFetch("/columnas/reordenar", {
    method: "PUT",
    body: JSON.stringify(idsEnOrden),
  });
}
