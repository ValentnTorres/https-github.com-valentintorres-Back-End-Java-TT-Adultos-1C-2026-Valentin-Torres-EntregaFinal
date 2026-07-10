// Tarjeta individual del tablero Kanban. Representa una Tarea dentro
// de su columna (segun su estado).
//
// Es "draggable": al arrastrarla, guardamos el id de la tarea en el
// dataTransfer del evento nativo de drag and drop del navegador (no
// usamos ninguna libreria externa, solo la API de HTML5).
import { obtenerIniciales, obtenerVarianteAvatar } from "../utils/avatar";
import { calcularEstadoFecha } from "../utils/fecha";

function TareaCard({
  tarea,
  esPrimeraColumna,
  esUltimaColumna,
  usuariosDisponibles,
  usuarioSeleccionado,
  onSeleccionarUsuario,
  onAsignar,
  onDesasignar,
  onEditar,
  onEliminar,
  onMoverAnterior,
  onMoverSiguiente,
  onDragStart,
}) {
  const estadoFecha = calcularEstadoFecha(tarea.fechaLimite, tarea.columna.esFinal);

  return (
    <div
      className="tarjeta"
      draggable
      onDragStart={(evento) => onDragStart(evento, tarea.id)}
    >
      {/* Puntito de agarre: solo indica visualmente que la tarjeta se
          puede arrastrar, no tiene logica propia (el drag funciona
          desde cualquier parte de la tarjeta). */}
      <span className="tarjeta-agarre" aria-hidden="true">⠿</span>

      <div className="tarjeta-etiquetas">
        <span className="etiqueta etiqueta-proyecto">{tarea.proyecto.nombre}</span>
        {estadoFecha && (
          <span className={`etiqueta etiqueta-fecha etiqueta-fecha--${estadoFecha.variante} dato-mono`}>
            {estadoFecha.texto}
          </span>
        )}
      </div>

      <h3 className="tarjeta-titulo">{tarea.titulo}</h3>
      {tarea.descripcion && <p className="tarjeta-descripcion">{tarea.descripcion}</p>}

      {tarea.usuariosAsignados.length > 0 && (
        <div className="tarjeta-asignados">
          {tarea.usuariosAsignados.map((usuario) => (
            <div className="asignado-fila" key={usuario.id}>
              <span
                className={`avatar avatar-chico ${obtenerVarianteAvatar(usuario.nombre)}`}
                title={usuario.nombre}
                aria-hidden="true"
              >
                {obtenerIniciales(usuario.nombre)}
              </span>
              <span className="asignado-nombre">{usuario.nombre}</span>
              <button
                className="asignado-quitar"
                onClick={() => onDesasignar(tarea.id, usuario.id)}
                title="Quitar"
                aria-label={`Quitar a ${usuario.nombre}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {usuariosDisponibles.length > 0 && (
        <div className="tarjeta-asignar">
          <select
            value={usuarioSeleccionado ?? ""}
            onChange={(evento) => onSeleccionarUsuario(tarea.id, evento.target.value)}
          >
            <option value="" disabled>
              Asignar a...
            </option>
            {usuariosDisponibles.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre}
              </option>
            ))}
          </select>
          <button onClick={() => onAsignar(tarea.id)}>+</button>
        </div>
      )}

      <div className="tarjeta-pie">
        {/* Botones de respaldo para mover la tarjeta de columna sin
            necesidad de arrastrarla con el mouse. */}
        <div className="tarjeta-mover">
          <button onClick={() => onMoverAnterior(tarea)} disabled={esPrimeraColumna} title="Mover a la columna anterior">
            ◀
          </button>
          <button onClick={() => onMoverSiguiente(tarea)} disabled={esUltimaColumna} title="Mover a la columna siguiente">
            ▶
          </button>
        </div>
        <div className="tarjeta-acciones">
          <button onClick={() => onEditar(tarea)}>Editar</button>
          <button
            onClick={() => {
              if (window.confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) onEliminar(tarea.id);
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TareaCard;
