// Pagina de Proyectos: lista los proyectos existentes y permite
// crear, editar y borrar. Es el CRUD mas simple de los tres porque
// Proyecto no depende de ninguna otra entidad.
import { useEffect, useState } from "react";
import {
  listarProyectos,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
} from "../api/proyectosApi";
import Mensaje from "./Mensaje";
import Skeleton from "./Skeleton";

const FORM_VACIO = { nombre: "", descripcion: "" };
// Cantidad de filas esqueleto a mostrar mientras carga. No hay forma de
// saber cuantos proyectos hay antes de que responda la API, asi que se
// muestra solo 1: si se muestran varias y despues resulta que hay menos
// proyectos reales, la lista "se encoge" de golpe al terminar de cargar,
// que se ve peor que el salto (minimo) de ir de 1 fila esqueleto a 1 fila real.
const FILAS_ESQUELETO = 1;

function ProyectosPage() {
  const [proyectos, setProyectos] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  // Trae la lista de proyectos del backend. La llamamos al montar el
  // componente y despues de cada crear/editar/borrar para mantener la
  // lista sincronizada con la base de datos. "cargando" solo importa la
  // primera vez (las veces siguientes ya esta en false y no vuelve a
  // mostrar el esqueleto).
  async function cargarProyectos() {
    try {
      const datos = await listarProyectos();
      setProyectos(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProyectos();
  }, []);

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setForm((formActual) => ({ ...formActual, [name]: value }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();
    setError("");
    try {
      if (idEnEdicion) {
        await actualizarProyecto(idEnEdicion, form);
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
    setForm({ nombre: proyecto.nombre, descripcion: proyecto.descripcion ?? "" });
  }

  function cancelarEdicion() {
    setIdEnEdicion(null);
    setForm(FORM_VACIO);
  }

  async function manejarEliminar(proyecto) {
    // Borrar un proyecto borra en cascada todas sus tareas (no hay forma
    // de deshacerlo despues), asi que conviene confirmar antes.
    const confirmado = window.confirm(
      `¿Eliminar el proyecto "${proyecto.nombre}"? Esto también borra todas sus tareas.`
    );
    if (!confirmado) return;

    setError("");
    try {
      await eliminarProyecto(proyecto.id);
      await cargarProyectos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="encabezado-seccion">
        <h2>Proyectos</h2>
        <p className="subtitulo">Agrupá el trabajo en proyectos para después organizar las tareas dentro de cada uno.</p>
      </div>

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
        <div className="campo campo-boton">
          <button type="submit">{idEnEdicion ? "Guardar cambios" : "Crear proyecto"}</button>
          {idEnEdicion && (
            <button type="button" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <Mensaje texto={error} />

      <ul className="lista">
        {cargando &&
          Array.from({ length: FILAS_ESQUELETO }).map((_, indice) => (
            <li key={indice}>
              <div>
                <Skeleton width="160px" height="16px" />
                <Skeleton className="skeleton-linea" width="220px" height="12px" />
              </div>
              <div className="acciones">
                <Skeleton width="64px" height="34px" />
                <Skeleton width="74px" height="34px" />
              </div>
            </li>
          ))}

        {!cargando &&
          proyectos.map((proyecto) => (
            <li key={proyecto.id} className="fade-in-suave">
              <div>
                <strong>{proyecto.nombre}</strong>
                {proyecto.descripcion && <p>{proyecto.descripcion}</p>}
              </div>
              <div className="acciones">
                <button onClick={() => empezarEdicion(proyecto)}>Editar</button>
                <button onClick={() => manejarEliminar(proyecto)}>Eliminar</button>
              </div>
            </li>
          ))}
        {!cargando && proyectos.length === 0 && <p className="fade-in-suave">Todavia no hay proyectos cargados.</p>}
      </ul>
    </section>
  );
}

export default ProyectosPage;
