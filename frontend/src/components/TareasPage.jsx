// Tablero Kanban de un proyecto puntual: columnas creadas por el
// usuario (como las listas de Trello), no un enum fijo de 3 estados.
//
// Cada proyecto tiene su propio tablero aislado (se entra clickeando
// el proyecto desde la pestaña Proyectos, ver App.jsx/proyectoAbiertoId):
// las tareas de otros proyectos nunca se mezclan aca. Las columnas si
// son compartidas por toda la app (no son "del proyecto"), asi que el
// pipeline (Pendiente/En progreso/Completada, o las que se hayan
// creado) es el mismo para todos los tableros.
//
// Ademas del CRUD de Tarea, esta pagina maneja:
//  - la relacion ManyToOne con Columna (crear, renombrar, marcar como
//    "final", reordenar y borrar columnas; mover una tarea de columna
//    arrastrandola, con los botones ◀ ▶, o con "Agregar tarea")
//  - la relacion ManyToMany con Usuario (asignar/desasignar usuarios
//    a cada tarea, con un select + boton en cada tarjeta) - un mismo
//    usuario puede estar asignado a varias tareas sin problema, la
//    unica regla es no repetirlo dos veces en la MISMA tarea
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
import { obtenerEquipo } from "../api/usuariosApi";
import Mensaje from "./Mensaje";
import Skeleton from "./Skeleton";
import TareaCard from "./TareaCard";
import InputFecha from "./InputFecha";
import { obtenerIniciales, obtenerVarianteAvatar } from "../utils/avatar";

// Cantidad de columnas/tarjetas esqueleto mientras carga el tablero por
// primera vez (no hay forma de saber cuantas columnas/tareas hay antes
// de que responda la API).
const COLUMNAS_ESQUELETO = 3;
const TARJETAS_ESQUELETO_POR_COLUMNA = 2;

function formVacio(columnaIdInicial = "") {
  return {
    titulo: "",
    descripcion: "",
    columnaId: columnaIdInicial,
    fechaLimite: "",
  };
}

function TareasPage({ proyectoAbiertoId, onVolver }) {
  const [tareas, setTareas] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(formVacio());
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
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
  // Id de la columna donde se esta escribiendo una tarea nueva "rapida"
  // (estilo Trello: titulo + fecha limite opcional, aparece al pie de
  // esa columna). Es ademas del formulario grande de arriba (que
  // tambien deja elegir Descripcion y Columna): las dos formas de
  // crear una tarea conviven, esta es solo un atajo para el caso comun
  // de "quiero anotar algo ya" sin llenar todos los campos.
  const [columnaCreandoTareaId, setColumnaCreandoTareaId] = useState(null);
  const [tituloTareaRapida, setTituloTareaRapida] = useState("");
  const [fechaTareaRapida, setFechaTareaRapida] = useState("");

  async function cargarDatos() {
    try {
      const [tareasData, columnasData, proyectosData, usuariosData] = await Promise.all([
        listarTareas(),
        listarColumnas(),
        listarProyectos(),
        obtenerEquipo(),
      ]);
      setTareas(tareasData);
      setColumnas(columnasData);
      setProyectos(proyectosData);
      setUsuarios(usuariosData);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  // Nombre del proyecto cuyo tablero se esta mostrando.
  const nombreProyecto = proyectos.find((p) => p.id === proyectoAbiertoId)?.nombre;

  // Aislamiento entre proyectos: de toda la lista de tareas (que trae
  // las de todos los proyectos), nos quedamos solo con las de este.
  // Las de otros proyectos nunca llegan a mostrarse en este tablero.
  const tareasDelProyecto = useMemo(
    () => tareas.filter((tarea) => tarea.proyecto.id === proyectoAbiertoId),
    [tareas, proyectoAbiertoId]
  );

  // Usuarios que tienen al menos una tarea asignada EN ESTE proyecto,
  // para mostrar la pila de avatares del encabezado (sin inventar
  // datos: sale directo de las asignaciones reales de este tablero).
  const usuariosActivos = useMemo(() => {
    const vistos = new Map();
    for (const tarea of tareasDelProyecto) {
      for (const usuario of tarea.usuariosAsignados) {
        vistos.set(usuario.id, usuario);
      }
    }
    return [...vistos.values()];
  }, [tareasDelProyecto]);

  const busquedaNormalizada = busqueda.trim().toLowerCase();

  const tareasVisibles = useMemo(() => {
    if (!busquedaNormalizada) return tareasDelProyecto;
    return tareasDelProyecto.filter((tarea) => tarea.titulo.toLowerCase().includes(busquedaNormalizada));
  }, [tareasDelProyecto, busquedaNormalizada]);

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setForm((formActual) => ({ ...formActual, [name]: value }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();
    setError("");

    // El backend espera columna/proyecto como un objeto { id: ... }, no
    // solo el numero, porque son relaciones ManyToOne de la entidad
    // Tarea. El proyecto es siempre el de este tablero: no hace falta
    // pedirselo al usuario, ya esta implicito en donde esta parado.
    const body = {
      titulo: form.titulo,
      descripcion: form.descripcion,
      columna: { id: Number(form.columnaId) },
      fechaLimite: form.fechaLimite || null,
      proyecto: { id: proyectoAbiertoId },
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

  // Version "rapida" de crear tarea: solo pide el titulo (la columna ya
  // se sabe, es la de donde se clickeo "+ Agregar tarea"), sin abrir el
  // formulario grande. Al estilo Trello, el cuadrito de texto se queda
  // abierto despues de crear una tarea, listo para escribir la
  // siguiente sin tener que volver a clickear "+ Agregar tarea".
  async function manejarCrearTareaRapida(evento, columnaId) {
    evento.preventDefault();
    if (!tituloTareaRapida.trim()) return;
    setError("");
    try {
      await crearTarea({
        titulo: tituloTareaRapida.trim(),
        descripcion: "",
        columna: { id: columnaId },
        fechaLimite: fechaTareaRapida || null,
        proyecto: { id: proyectoAbiertoId },
      });
      setTituloTareaRapida("");
      setFechaTareaRapida("");
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  }

  function empezarCrearTareaRapida(columnaId) {
    // Si el formulario grande estaba abierto, lo cerramos: las dos
    // formas de crear una tarea no tiene sentido tenerlas abiertas
    // juntas al mismo tiempo.
    cancelarEdicion();
    setColumnaCreandoTareaId(columnaId);
    setTituloTareaRapida("");
    setFechaTareaRapida("");
  }

  function cancelarTareaRapida() {
    setColumnaCreandoTareaId(null);
    setTituloTareaRapida("");
    setFechaTareaRapida("");
  }

  function empezarEdicion(tarea) {
    cancelarTareaRapida();
    setIdEnEdicion(tarea.id);
    setForm({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion ?? "",
      columnaId: String(tarea.columna.id),
      fechaLimite: tarea.fechaLimite ?? "",
    });
    setMostrarFormulario(true);
  }

  // Abre el formulario grande de creacion (boton "+ Nueva tarea" de
  // arriba). El "agregar rapido" de cada columna (mas abajo) es un
  // atajo aparte, no pasa por aca.
  function abrirFormularioNuevo(columnaIdInicial) {
    cancelarTareaRapida();
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
    if (!window.confirm(`¿Eliminar la columna "${columna.nombre}"?`)) return;

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
          <button type="button" className="volver-proyectos" onClick={onVolver}>
            ← Volver a Proyectos
          </button>
          <h2>{cargando ? <Skeleton width="180px" height="28px" /> : nombreProyecto ?? "Proyecto"}</h2>
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
            {cargando ? (
              <Skeleton width="70px" height="12px" />
            ) : (
              <span className="tablero-contador dato-mono">
                {tareasVisibles.length} / {tareasDelProyecto.length} tareas
              </span>
            )}
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
            <InputFecha
              id="fecha-tarea"
              value={form.fechaLimite}
              onChange={(iso) => setForm((formActual) => ({ ...formActual, fechaLimite: iso }))}
            />
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
        {cargando ? (
          Array.from({ length: COLUMNAS_ESQUELETO }).map((_, indiceColumna) => (
            <div className="columna" key={indiceColumna}>
              <div className="columna-header">
                <div className="columna-header-fila">
                  <Skeleton width="90px" height="12px" />
                </div>
              </div>
              <div className="columna-cuerpo">
                {Array.from({ length: TARJETAS_ESQUELETO_POR_COLUMNA }).map((_, indiceTarjeta) => (
                  <div className="tarjeta" key={indiceTarjeta}>
                    <Skeleton width="70%" height="14px" />
                    <Skeleton className="skeleton-linea" width="90%" height="12px" />
                    <Skeleton className="skeleton-linea" width="50%" height="12px" />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <>
            {columnas.map((columna, indiceColumna) => {
          const tareasDeLaColumna = tareasVisibles.filter((t) => t.columna.id === columna.id);
          const seEstaRenombrando = columnaEnEdicionId === columna.id;

          return (
            <div
              key={columna.id}
              className={`columna fade-in-suave${columna.esFinal ? " columna--final" : ""}${
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
                    {tareasDelProyecto.some((t) => t.columna.id === columna.id) ? "Sin resultados" : "Sin tareas"}
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

                {columnaCreandoTareaId === columna.id ? (
                  <form className="tarea-rapida-form" onSubmit={(evento) => manejarCrearTareaRapida(evento, columna.id)}>
                    <input
                      autoFocus
                      placeholder="Título de la tarea"
                      value={tituloTareaRapida}
                      onChange={(evento) => setTituloTareaRapida(evento.target.value)}
                      onKeyDown={(evento) => {
                        if (evento.key === "Escape") cancelarTareaRapida();
                      }}
                    />
                    <InputFecha title="Fecha límite (opcional)" value={fechaTareaRapida} onChange={setFechaTareaRapida} />
                    <div className="tarea-rapida-botones">
                      <button type="submit">Agregar tarea</button>
                      <button type="button" onClick={cancelarTareaRapida}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="boton-agregar-columna"
                    onClick={() => empezarCrearTareaRapida(columna.id)}
                  >
                    + Agregar tarea
                  </button>
                )}
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
          </>
        )}
      </div>
    </section>
  );
}

export default TareasPage;
