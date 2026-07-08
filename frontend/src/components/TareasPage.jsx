// Pagina de Tareas: tablero Kanban con columnas creadas por el
// usuario (como las listas de Trello), no un enum fijo de 3 estados.
//
// Ademas del CRUD de Tarea, esta pagina maneja:
//  - la relacion ManyToOne con Proyecto (un select en el formulario, y
//    un filtro de solo-lectura en la barra superior)
//  - la relacion ManyToOne con Columna (crear, renombrar, marcar como
//    "final", reordenar y borrar columnas; mover una tarea de columna
//    arrastrandola, con los botones ◀ ▶, o con "Agregar tarea")
//  - la relacion ManyToMany con Usuario (asignar/desasignar usuarios
//    a cada tarea, con un select + boton en cada tarjeta)
//  - busqueda por titulo, que atenua (no oculta) las tarjetas que no matchean
import { useEffect, useMemo, useState } from "react";
import {
  listarTareas,
  crearTarea,
  actualizarTarea,
  eliminarTarea,
  asignarUsuarioATarea,
  desasignarUsuarioDeTarea,
} from "../api/tareasApi";
import {
  listarColumnas,
  crearColumna,
  actualizarColumna,
  eliminarColumna,
  reordenarColumnas,
} from "../api/columnasApi";
import { listarProyectos } from "../api/proyectosApi";
import { listarUsuarios } from "../api/usuariosApi";
import Mensaje from "./Mensaje";
import TareaCard from "./TareaCard";
import { obtenerIniciales, obtenerVarianteAvatar } from "../utils/avatar";

function formVacio(columnaIdInicial = "") {
  return {
    titulo: "",
    descripcion: "",
    columnaId: columnaIdInicial,
    fechaLimite: "",
    proyectoId: "",
  };
}

function TareasPage() {
  const [tareas, setTareas] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(formVacio());
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroProyectoId, setFiltroProyectoId] = useState("");
  const [error, setError] = useState("");
  // Guarda que usuario esta seleccionado en el select de "asignar"
  // de cada tarjeta (una entrada por id de tarea).
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState({});
  // Que columna esta "recibiendo" una tarjeta arrastrada ahora mismo,
  // para resaltarla.
  const [columnaResaltada, setColumnaResaltada] = useState(null);
  // Id de la columna que se esta renombrando ahora mismo (null = ninguna).
  const [columnaEnEdicionId, setColumnaEnEdicionId] = useState(null);
  const [nombreColumnaEdit, setNombreColumnaEdit] = useState("");
  // Panel para crear una columna nueva (estilo Trello: aparece al
  // final del tablero).
  const [creandoColumna, setCreandoColumna] = useState(false);
  const [nombreColumnaNueva, setNombreColumnaNueva] = useState("");

  async function cargarDatos() {
    try {
      const [tareasData, columnasData, proyectosData, usuariosData] = await Promise.all([
        listarTareas(),
        listarColumnas(),
        listarProyectos(),
        listarUsuarios(),
      ]);
      setTareas(tareasData);
      setColumnas(columnasData);
      setProyectos(proyectosData);
      setUsuarios(usuariosData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // Usuarios que tienen al menos una tarea asignada en todo el tablero,
  // para mostrar la pila de avatares del encabezado (sin inventar datos:
  // sale directo de las asignaciones reales).
  const usuariosActivos = useMemo(() => {
    const vistos = new Map();
    for (const tarea of tareas) {
      for (const usuario of tarea.usuariosAsignados) {
        vistos.set(usuario.id, usuario);
      }
    }
    return [...vistos.values()];
  }, [tareas]);

  const busquedaNormalizada = busqueda.trim().toLowerCase();

  const tareasVisibles = useMemo(() => {
    return tareas.filter((tarea) => {
      const coincideProyecto = !filtroProyectoId || String(tarea.proyecto.id) === filtroProyectoId;
      const coincideBusqueda =
        !busquedaNormalizada || tarea.titulo.toLowerCase().includes(busquedaNormalizada);
      return coincideProyecto && coincideBusqueda;
    });
  }, [tareas, filtroProyectoId, busquedaNormalizada]);

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setForm((formActual) => ({ ...formActual, [name]: value }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();
    setError("");

    // El backend espera proyecto/columna como un objeto { id: ... },
    // no solo el numero, porque son relaciones ManyToOne de la entidad Tarea.
    const body = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      columna: { id: Number(form.columnaId) },
      fechaLimite: form.fechaLimite || null,
      proyecto: { id: Number(form.proyectoId) },
    };

    try {
      if (idEnEdicion) {
        await actualizarTarea(idEnEdicion, body);
      } else {
        await crearTarea(body);
      }
      setForm(formVacio());
      setIdEnEdicion(null);
      setMostrarFormulario(false);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  function empezarEdicion(tarea) {
    setIdEnEdicion(tarea.id);
    setForm({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion ?? "",
      columnaId: String(tarea.columna.id),
      fechaLimite: tarea.fechaLimite ?? "",
      proyectoId: String(tarea.proyecto.id),
    });
    setMostrarFormulario(true);
  }

  // Abre el panel de creacion con la columna de destino ya seleccionada
  // (boton "+ Agregar tarea" al pie de cada columna).
  function abrirFormularioNuevo(columnaIdInicial) {
    setIdEnEdicion(null);
    setForm(formVacio(columnaIdInicial ?? String(columnas[0]?.id ?? "")));
    setMostrarFormulario(true);
  }

  function cancelarEdicion() {
    setIdEnEdicion(null);
    setForm(formVacio());
    setMostrarFormulario(false);
  }

  async function manejarEliminar(id) {
    setError("");
    try {
      await eliminarTarea(id);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarAsignar(tareaId) {
    setError("");
    const usuarioId = usuarioParaAsignar[tareaId];
    if (!usuarioId) return;
    try {
      await asignarUsuarioATarea(tareaId, usuarioId);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarDesasignar(tareaId, usuarioId) {
    setError("");
    try {
      await desasignarUsuarioDeTarea(tareaId, usuarioId);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  // Cambia la columna de una tarea (mover de columna), reenviando el
  // resto de sus datos tal cual estaban (el PUT del backend reemplaza
  // el objeto completo, no admite cambios parciales).
  async function moverTarea(tarea, nuevaColumnaId) {
    if (!nuevaColumnaId || tarea.columna.id === nuevaColumnaId) return;
    setError("");
    try {
      await actualizarTarea(tarea.id, {
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        columna: { id: nuevaColumnaId },
        fechaLimite: tarea.fechaLimite,
        proyecto: { id: tarea.proyecto.id },
      });
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  // --- CRUD de columnas ---
  async function manejarCrearColumna(evento) {
    evento.preventDefault();
    if (!nombreColumnaNueva.trim()) return;
    setError("");
    try {
      await crearColumna({ nombre: nombreColumnaNueva.trim(), esFinal: false });
      setNombreColumnaNueva("");
      setCreandoColumna(false);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  function empezarRenombreColumna(columna) {
    setColumnaEnEdicionId(columna.id);
    setNombreColumnaEdit(columna.nombre);
  }

  async function guardarRenombreColumna(columna) {
    if (!nombreColumnaEdit.trim() || nombreColumnaEdit.trim() === columna.nombre) {
      setColumnaEnEdicionId(null);
      return;
    }
    setError("");
    try {
      await actualizarColumna(columna.id, { nombre: nombreColumnaEdit.trim(), esFinal: columna.esFinal });
      setColumnaEnEdicionId(null);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function alternarColumnaFinal(columna) {
    setError("");
    try {
      await actualizarColumna(columna.id, { nombre: columna.nombre, esFinal: !columna.esFinal });
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminarColumna(columna) {
    setError("");
    try {
      await eliminarColumna(columna.id);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function moverColumna(indice, direccion) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= columnas.length) return;
    setError("");
    const idsEnOrden = columnas.map((c) => c.id);
    [idsEnOrden[indice], idsEnOrden[destino]] = [idsEnOrden[destino], idsEnOrden[indice]];
    try {
      await reordenarColumnas(idsEnOrden);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Manejo del drag and drop nativo (sin librerias externas) ---
  function manejarDragStart(evento, tareaId) {
    evento.dataTransfer.setData("text/plain", String(tareaId));
  }

  function manejarDragOver(evento) {
    // Hace falta cancelar el evento para que el navegador permita soltar (drop) aca.
    evento.preventDefault();
  }

  function manejarDragEnter(columnaId) {
    setColumnaResaltada(columnaId);
  }

  function manejarDragLeave(evento, columnaIdDeEstaColumna) {
    // "dragleave" tambien dispara al pasar por encima de los hijos
    // (las tarjetas) de la columna. Solo apagamos el resaltado si
    // realmente salimos del rectangulo de la columna, no de una tarjeta.
    if (!evento.currentTarget.contains(evento.relatedTarget)) {
      setColumnaResaltada((actual) => (actual === columnaIdDeEstaColumna ? null : actual));
    }
  }

  function manejarDrop(evento, columnaId) {
    evento.preventDefault();
    setColumnaResaltada(null);
    const tareaId = Number(evento.dataTransfer.getData("text/plain"));
    const tarea = tareas.find((t) => t.id === tareaId);
    if (tarea) moverTarea(tarea, columnaId);
  }

  return (
    <section>
      <div className="tablero-toolbar">
        <div className="tablero-titulo-bloque">
          <h2>Tareas</h2>
          <div className="tablero-meta">
            {usuariosActivos.length > 0 && (
              <div className="avatares-pila" title={usuariosActivos.map((u) => u.nombre).join(", ")}>
                {usuariosActivos.slice(0, 4).map((usuario) => (
                  <span
                    key={usuario.id}
                    className={`avatar avatar-chico avatar-pila ${obtenerVarianteAvatar(usuario.nombre)}`}
                  >
                    {obtenerIniciales(usuario.nombre)}
                  </span>
                ))}
                {usuariosActivos.length > 4 && (
                  <span className="avatar avatar-chico avatar-pila avatar-gris">
                    +{usuariosActivos.length - 4}
                  </span>
                )}
              </div>
            )}
            <span className="tablero-contador dato-mono">
              {tareasVisibles.length} / {tareas.length} tareas
            </span>
          </div>
        </div>

        <div className="tablero-acciones">
          <input
            className="input-busqueda"
            type="search"
            placeholder="Buscar tareas..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
          <select
            className="select-filtro"
            value={filtroProyectoId}
            onChange={(evento) => setFiltroProyectoId(evento.target.value)}
          >
            <option value="">Todos los proyectos</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.nombre}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="boton-primario"
            disabled={columnas.length === 0}
            title={columnas.length === 0 ? "Primero creá una columna" : undefined}
            onClick={() => (mostrarFormulario ? cancelarEdicion() : abrirFormularioNuevo())}
          >
            {mostrarFormulario ? "Cerrar" : "+ Nueva tarea"}
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <form className="formulario" onSubmit={manejarSubmit}>
          <div className="campo">
            <label htmlFor="titulo-tarea">Título</label>
            <input
              id="titulo-tarea"
              name="titulo"
              placeholder="¿Qué hay que hacer?"
              value={form.titulo}
              onChange={manejarCambio}
              required
            />
          </div>
          <div className="campo campo-ancho">
            <label htmlFor="descripcion-tarea">Descripción (opcional)</label>
            <input
              id="descripcion-tarea"
              name="descripcion"
              placeholder="Detalle breve"
              value={form.descripcion}
              onChange={manejarCambio}
            />
          </div>
          <div className="campo">
            <label htmlFor="columna-tarea">Columna</label>
            <select id="columna-tarea" name="columnaId" value={form.columnaId} onChange={manejarCambio} required>
              <option value="" disabled>
                Seleccionar columna
              </option>
              {columnas.map((columna) => (
                <option key={columna.id} value={columna.id}>
                  {columna.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="fecha-tarea">Fecha límite</label>
            <input
              id="fecha-tarea"
              name="fechaLimite"
              type="date"
              value={form.fechaLimite}
              onChange={manejarCambio}
            />
          </div>
          <div className="campo">
            <label htmlFor="proyecto-tarea">Proyecto</label>
            <select
              id="proyecto-tarea"
              name="proyectoId"
              value={form.proyectoId}
              onChange={manejarCambio}
              required
            >
              <option value="" disabled>
                Seleccionar proyecto
              </option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="campo campo-boton">
            <button type="submit">{idEnEdicion ? "Guardar cambios" : "Crear tarea"}</button>
            <button type="button" onClick={cancelarEdicion}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <Mensaje texto={error} />

      <div className="tablero">
        {columnas.map((columna, indiceColumna) => {
          const tareasDeLaColumna = tareasVisibles.filter((t) => t.columna.id === columna.id);
          const seEstaRenombrando = columnaEnEdicionId === columna.id;

          return (
            <div
              key={columna.id}
              className={`columna${columna.esFinal ? " columna--final" : ""}${
                columnaResaltada === columna.id ? " columna-resaltada" : ""
              }`}
              onDragOver={manejarDragOver}
              onDragEnter={() => manejarDragEnter(columna.id)}
              onDragLeave={(evento) => manejarDragLeave(evento, columna.id)}
              onDrop={(evento) => manejarDrop(evento, columna.id)}
            >
              <div className="columna-header">
                <div className="columna-header-fila">
                  <button
                    type="button"
                    className="columna-mover"
                    onClick={() => moverColumna(indiceColumna, -1)}
                    disabled={indiceColumna === 0}
                    title="Mover columna a la izquierda"
                  >
                    ◀
                  </button>

                  {seEstaRenombrando ? (
                    <input
                      className="columna-nombre-input"
                      autoFocus
                      value={nombreColumnaEdit}
                      onChange={(evento) => setNombreColumnaEdit(evento.target.value)}
                      onBlur={() => guardarRenombreColumna(columna)}
                      onKeyDown={(evento) => {
                        if (evento.key === "Enter") guardarRenombreColumna(columna);
                        if (evento.key === "Escape") setColumnaEnEdicionId(null);
                      }}
                    />
                  ) : (
                    <span
                      className="columna-nombre"
                      onClick={() => empezarRenombreColumna(columna)}
                      title="Click para renombrar"
                    >
                      {columna.nombre}
                    </span>
                  )}

                  <span className="columna-contador dato-mono">{tareasDeLaColumna.length}</span>

                  <button
                    type="button"
                    className="columna-mover"
                    onClick={() => moverColumna(indiceColumna, 1)}
                    disabled={indiceColumna === columnas.length - 1}
                    title="Mover columna a la derecha"
                  >
                    ▶
                  </button>
                </div>
                <div className="columna-header-fila columna-header-acciones">
                  <button
                    type="button"
                    className={`columna-chip-final${columna.esFinal ? " columna-chip-final--activo" : ""}`}
                    onClick={() => alternarColumnaFinal(columna)}
                    title="Marcar como columna final: bloquea asignar usuarios a sus tareas"
                  >
                    Final
                  </button>
                  <button
                    type="button"
                    className="columna-eliminar"
                    onClick={() => manejarEliminarColumna(columna)}
                    title="Eliminar columna (solo si no tiene tareas)"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="columna-cuerpo">
                {tareasDeLaColumna.length === 0 && (
                  <p className="columna-vacia">
                    {tareas.some((t) => t.columna.id === columna.id) ? "Sin resultados" : "Sin tareas"}
                  </p>
                )}

                {tareasDeLaColumna.map((tarea) => {
                  // Usuarios que todavia no estan asignados a esta tarea,
                  // para no repetirlos en el select de "asignar".
                  const idsAsignados = tarea.usuariosAsignados.map((u) => u.id);
                  const usuariosDisponibles = usuarios.filter((u) => !idsAsignados.includes(u.id));
                  const columnaAnterior = columnas[indiceColumna - 1];
                  const columnaSiguiente = columnas[indiceColumna + 1];

                  return (
                    <TareaCard
                      key={tarea.id}
                      tarea={tarea}
                      esPrimeraColumna={indiceColumna === 0}
                      esUltimaColumna={indiceColumna === columnas.length - 1}
                      usuariosDisponibles={usuariosDisponibles}
                      usuarioSeleccionado={usuarioParaAsignar[tarea.id]}
                      onSeleccionarUsuario={(tareaId, usuarioId) =>
                        setUsuarioParaAsignar((actual) => ({ ...actual, [tareaId]: usuarioId }))
                      }
                      onAsignar={manejarAsignar}
                      onDesasignar={manejarDesasignar}
                      onEditar={empezarEdicion}
                      onEliminar={manejarEliminar}
                      onMoverAnterior={(t) => moverTarea(t, columnaAnterior?.id)}
                      onMoverSiguiente={(t) => moverTarea(t, columnaSiguiente?.id)}
                      onDragStart={manejarDragStart}
                    />
                  );
                })}

                <button
                  type="button"
                  className="boton-agregar-columna"
                  onClick={() => abrirFormularioNuevo(String(columna.id))}
                >
                  + Agregar tarea
                </button>
              </div>
            </div>
          );
        })}

        {/* Columna fantasma para crear una columna nueva, al estilo Trello. */}
        <div className="columna columna-nueva">
          {creandoColumna ? (
            <form className="columna-nueva-form" onSubmit={manejarCrearColumna}>
              <input
                autoFocus
                placeholder="Nombre de la columna"
                value={nombreColumnaNueva}
                onChange={(evento) => setNombreColumnaNueva(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === "Escape") {
                    setCreandoColumna(false);
                    setNombreColumnaNueva("");
                  }
                }}
              />
              <div className="columna-nueva-botones">
                <button type="submit">Agregar columna</button>
                <button
                  type="button"
                  onClick={() => {
                    setCreandoColumna(false);
                    setNombreColumnaNueva("");
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="columna-nueva-boton" onClick={() => setCreandoColumna(true)}>
              + Agregar columna
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default TareasPage;
