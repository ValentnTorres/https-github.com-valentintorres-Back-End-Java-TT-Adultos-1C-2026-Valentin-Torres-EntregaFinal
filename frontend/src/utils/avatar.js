// Helpers de avatar de iniciales, compartidos entre UsuariosPage y el
// tablero de Tareas (antes estaban duplicados en UsuariosPage).
const VARIANTES_AVATAR = ["avatar-azul", "avatar-gris", "avatar-verde"];

export function obtenerIniciales(nombre) {
  const palabras = nombre.trim().split(/\s+/);
  const primeras = palabras.slice(0, 2).map((palabra) => palabra[0]);
  return primeras.join("").toUpperCase();
}

export function obtenerVarianteAvatar(nombre) {
  const suma = [...nombre].reduce((acumulado, letra) => acumulado + letra.charCodeAt(0), 0);
  return VARIANTES_AVATAR[suma % VARIANTES_AVATAR.length];
}
