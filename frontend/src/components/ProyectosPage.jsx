// Pagina de Proyectos: lista los proyectos existentes y permite
// crear, editar y borrar. Es el CRUD mas simple de los tres porque
// Proyecto no depende de ninguna otra entidad.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listarProyectos,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
} from "../api/proyectosApi";
import { listarTareas } from "../api/tareasApi";
import { listarUsuarios } from "../api/usuariosApi";
import Mensaje from "./Mensaje";
import Skeleton from "./Skeleton";
import ConfirmModal from "./ConfirmModal";
import { obtenerIniciales, obtenerVarianteAvatar } from "../utils/avatar";

const FORM_VACIO = { nombre: "", descripcion: "", pmId: "" };
// Cantidad de filas esqueleto a mostrar mientras carga. No hay forma de
// saber cuantos proyectos hay antes de que responda la API, asi que se
// muestra solo 1: si se muestran varias y despues resulta que hay menos
// proyectos reales, la lista "se encoge" de golpe al terminar de cargar,
// que se ve peor que el salto (minimo) de ir de 1 fila esqueleto a 1 fila real.
const FILAS_ESQUELETO = 1;

function ProyectosPage({ onVerTareas, usuario }) {
  const [proyectos, setProyectos] = useState([]);
  // Todas las tareas (de los proyectos visibles), para calcular el
  // progreso y los usuarios asignados de cada proyecto sin pedirle al
  // backend un endpoint de estadisticas aparte.
  const [tareas, setTareas] = useState([]);
  // Lista de PMs del sistema, solo se pide si sos ADMIN: la usa el
  // selector de "reasignar PM dueño" en el formulario de edición.
  const [pms, setPms] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  // Proyecto que se esta por borrar (null = no hay modal abierto).
  const [proyectoAEliminar, setProyectoAEliminar] = useState(null);

  const esAdmin = usuario.rol === "ADMIN";

  // Trae la lista de proyectos y de tareas del backend. La llamamos al
  // montar el componente y despues de cada crear/editar/borrar para
  // mantener todo sincronizado con la base de datos. "cargando" solo
  // importa la primera vez (las veces siguientes ya esta en false y no
  // vuelve a mostrar el esqueleto).
  const cargarProyectos = useCallback(async () => {
    try {
      const [proyectosData, tareasData, usuariosData] = await Promise.all([
        listarProyectos(),
        listarTareas(),
        esAdmin ? listarUsuarios() : Promise.resolve([]),
      ]);
      setProyectos(proyectosData);
      setTareas(tareasData);
      setPms(usuariosData.filter((u) => u.rol === "PM"));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [esAdmin]);

  useEffect(() => {
    cargarProyectos();
  }, [cargarProyectos]);

  // Progreso (tareas completadas/totales) y usuarios asignados de cada
  // proyecto, calculado una sola vez por render en vez de recorrer
  // "tareas" adentro del .map() de cada fila.
  const estadisticasPorProyecto = useMemo(() => {
    const mapa = new Map();
    for (const tarea of tareas) {
      const proyectoId = tarea.proyecto?.id;
      if (proyectoId == null) continue;
      if (!mapa.has(proyectoId)) {
        mapa.set(proyectoId, { total: 0, completadas: 0, usuarios: new Map() });
      }
      const stats = mapa.get(proyectoId);
      stats.total += 1;
      if (tarea.columna?.esFinal) stats.completadas += 1;
      for (const usuario of tarea.usuariosAsignados ?? []) {
        stats.usuarios.set(usuario.id, usuario);
      }
    }
    return mapa;
  }, [tareas]);

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setForm((formActual) => ({ ...formActual, [name]: value }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();
    setError("");
    try {
      if (idEnEdicion) {
        // El selector de PM solo lo ve/edita un ADMIN (ver el form mas
        // abajo); para cualquier otro caso no se manda "creadoPor" y el
        // backend deja el dueño del proyecto como estaba.
        const body = esAdmin && form.pmId ? { ...form, creadoPor: { id: Number(form.pmId) } } : form;
        await actualizarProyecto(idEnEdicion, body);
      } else {
        await crearProyecto(form);
      }
      setForm(FORM_VACIO);
      setIdEnEdicion(null);
      await cargarProyectos();
    } catch (err) {
      setError(err.message);
    }
  }

  function empezarEdicion(proyecto) {
    setIdEnEdicion(proyecto.id);
    setForm({
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion ?? "",
      pmId: proyecto.creadoPor?.id ? String(proyecto.creadoPor.id) : "",
    });
  }

  function cancelarEdicion() {
    setIdEnEdicion(null);
    setForm(FORM_VACIO);
  }

  // Borrar un proyecto borra en cascada todas sus tareas (no hay forma
  // de deshacerlo despues), asi que conviene confirmar antes (ver
  // ConfirmModal, mas abajo en el render).
  async function confirmarEliminar() {
    const proyecto = proyectoAEliminar;
    setProyectoAEliminar(null);
    setError("");
    try {
      await eliminarProyecto(proyecto.id);
      await cargarProyectos();
    } catch (err) {
      setError(err.message);
    }
  }

  // Un USER solo ve los proyectos que le tocaron (los de su PM
  // asignado): no crea ni edita/borra proyectos, eso es cosa de
  // PM/ADMIN. Ocultamos el form entero en vez de mostrarlo y dejar que
  // el backend responda 403, para no confundir a alguien que ni
  // siquiera deberia ver la opcion.
  const puedeCrear = usuario.rol !== "USER";

  function puedeEditar(proyecto) {
    return usuario.rol === "ADMIN" || proyecto.creadoPor?.id === usuario.id;
  }

  return (
    <section>
      <div className="encabezado-seccion">
        <h2>Proyectos</h2>
        <p className="subtitulo">
          Agrupá el trabajo en proyectos para después organizar las tareas dentro de cada uno. Hacé click en un
          proyecto para ver sus tareas.
        </p>
      </div>

      {puedeCrear && (
        <form className="formulario" onSubmit={manejarSubmit}>
          <div className="campo">
            <label htmlFor="nombre-proyecto">Nombre del proyecto</label>
            <input
              id="nombre-proyecto"
              name="nombre"
              placeholder="Ej: Proyecto Final Java"
              value={form.nombre}
              onChange={manejarCambio}
              required
            />
          </div>
          <div className="campo campo-ancho">
            <label htmlFor="descripcion-proyecto">Descripción (opcional)</label>
            <input
              id="descripcion-proyecto"
              name="descripcion"
              placeholder="¿De qué se trata este proyecto?"
              value={form.descripcion}
              onChange={manejarCambio}
            />
          </div>
          {esAdmin && idEnEdicion && (
            <div className="campo">
              <label htmlFor="pm-proyecto">PM dueño</label>
              <select
                id="pm-proyecto"
                name="pmId"
                value={form.pmId}
                onChange={manejarCambio}
                title="Reasignar el proyecto a otro PM"
              >
                {pms.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="campo campo-boton">
            <button type="submit">{idEnEdicion ? "Guardar cambios" : "Crear proyecto"}</button>
            {idEnEdicion && (
              <button type="button" onClick={cancelarEdicion}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <Mensaje texto={error} />

      <ul className="lista">
        {cargando &&
          Array.from({ length: FILAS_ESQUELETO }).map((_, indice) => (
            <li key={indice}>
              <div>
                <Skeleton width="160px" height="16px" />
                <Skeleton className="skeleton-linea" width="220px" height="12px" />
                <Skeleton className="skeleton-linea" width="140px" height="6px" />
              </div>
              <div className="acciones">
                <Skeleton width="64px" height="34px" />
                <Skeleton width="74px" height="34px" />
              </div>
            </li>
          ))}

        {!cargando &&
          proyectos.map((proyecto) => {
            const stats = estadisticasPorProyecto.get(proyecto.id);
            const total = stats?.total ?? 0;
            const completadas = stats?.completadas ?? 0;
            const restantes = total - completadas;
            const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
            const usuariosAsignados = stats ? [...stats.usuarios.values()] : [];
            const textoProgreso =
              total === 0 ? "Sin tareas todavía" : `${restantes} restante${restantes === 1 ? "" : "s"} de ${total}`;

            return (
              <li key={proyecto.id} className="fade-in-suave">
                <button
                  type="button"
                  className="proyecto-info-boton"
                  onClick={() => onVerTareas(proyecto.id)}
                  title="Ver las tareas de este proyecto"
                >
                  <strong>{proyecto.nombre}</strong>
                  {proyecto.descripcion && <p>{proyecto.descripcion}</p>}

                  <div className="proyecto-progreso">
                    <div
                      className="proyecto-progreso-barra"
                      role="progressbar"
                      aria-valuenow={porcentaje}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="proyecto-progreso-relleno" style={{ width: `${porcentaje}%` }} />
                    </div>
                    <div className="proyecto-progreso-meta">
                      <span className="dato-mono">{textoProgreso}</span>
                      {usuariosAsignados.length > 0 && (
                        <div
                          className="avatares-pila"
                          title={usuariosAsignados.map((usuario) => usuario.nombre).join(", ")}
                        >
                          {usuariosAsignados.slice(0, 4).map((usuario) => (
                            <span
                              key={usuario.id}
                              className={`avatar avatar-chico avatar-pila ${obtenerVarianteAvatar(usuario.nombre)}`}
                            >
                              {obtenerIniciales(usuario.nombre)}
                            </span>
                          ))}
                          {usuariosAsignados.length > 4 && (
                            <span className="avatar avatar-chico avatar-pila avatar-gris">
                              +{usuariosAsignados.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                {puedeEditar(proyecto) && (
                  <div className="acciones">
                    <button onClick={() => empezarEdicion(proyecto)}>Editar</button>
                    <button onClick={() => setProyectoAEliminar(proyecto)}>Eliminar</button>
                  </div>
                )}
              </li>
            );
          })}
        {!cargando && proyectos.length === 0 && <p className="fade-in-suave">Todavia no hay proyectos cargados.</p>}
      </ul>

      <ConfirmModal
        mensaje={
          proyectoAEliminar
            ? `¿Eliminar el proyecto "${proyectoAEliminar.nombre}"? Esto también borra todas sus tareas.`
            : null
        }
        onConfirmar={confirmarEliminar}
        onCancelar={() => setProyectoAEliminar(null)}
      />
    </section>
  );
}

export default ProyectosPage;
