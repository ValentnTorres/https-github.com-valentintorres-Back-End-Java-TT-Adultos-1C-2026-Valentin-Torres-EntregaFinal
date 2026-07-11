// Modal de confirmacion generico, para reemplazar los window.confirm()
// nativos del navegador (que no se pueden estilar y se ven distinto
// segun el navegador/sistema operativo) en las acciones destructivas
// (borrar proyecto, usuario, tarea, columna).
//
// Se renderiza con un portal directo a <body>, no como hijo normal de
// donde se invoca: TareaCard.jsx lo usa desde adentro de una tarjeta
// que tiene "transform" en :hover, y position:fixed queda "atrapado"
// dentro de cualquier ancestro con transform en vez de cubrir toda la
// pantalla - el portal evita ese problema de raiz.
//
// Se muestra o se oculta segun si "mensaje" tiene contenido o no (el
// componente que lo usa guarda en un estado propio "cual" elemento se
// esta por borrar, y arma el mensaje a partir de eso - ver ejemplos en
// ProyectosPage.jsx, UsuariosPage.jsx, TareasPage.jsx y TareaCard.jsx).
import { useEffect } from "react";
import { createPortal } from "react-dom";

function ConfirmModal({ mensaje, textoConfirmar = "Eliminar", onConfirmar, onCancelar }) {
  // Cerrar con Escape, igual que se podria "cancelar" un confirm() nativo.
  useEffect(() => {
    if (!mensaje) return;
    function manejarTecla(evento) {
      if (evento.key === "Escape") onCancelar();
    }
    document.addEventListener("keydown", manejarTecla);
    return () => document.removeEventListener("keydown", manejarTecla);
  }, [mensaje, onCancelar]);

  if (!mensaje) return null;

  return createPortal(
    <div className="modal-fondo" onClick={onCancelar}>
      <div
        className="modal-tarjeta"
        role="alertdialog"
        aria-modal="true"
        onClick={(evento) => evento.stopPropagation()}
      >
        <p className="modal-mensaje">{mensaje}</p>
        <div className="modal-botones">
          <button type="button" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="modal-boton-peligro" onClick={onConfirmar} autoFocus>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;
