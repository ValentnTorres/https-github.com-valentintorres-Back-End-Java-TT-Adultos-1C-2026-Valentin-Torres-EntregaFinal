// Componente chico y reutilizable para mostrar errores que vienen
// de la API (por ejemplo, cuando el backend responde 400 o 404).
// Si no hay texto, no renderiza nada.
function Mensaje({ texto }) {
  if (!texto) return null;

  return <p className="mensaje-error">{texto}</p>;
}

export default Mensaje;
