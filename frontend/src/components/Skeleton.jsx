// Placeholder de carga: una barra gris con un brillo animado que barre
// de lado a lado (ver .skeleton en App.css). Cada pagina arma su propia
// version en miniatura del contenido real con estos bloques (mismo
// ancho/alto aproximado) para que al llegar los datos no haya un salto
// de layout: el esqueleto ya ocupa el espacio que va a ocupar la fila
// o tarjeta real.
function Skeleton({ width = "100%", height = "1em", circulo = false, className = "" }) {
  return (
    <span
      className={`skeleton ${circulo ? "skeleton-circulo" : ""} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
