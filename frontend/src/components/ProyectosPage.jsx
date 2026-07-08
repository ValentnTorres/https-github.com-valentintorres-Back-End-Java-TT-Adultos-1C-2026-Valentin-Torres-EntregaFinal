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

const FORM_VACIO = { nombre: "", descripcion: "" };

function ProyectosPage() {
  const [proyectos, setProyectos] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [error, setError] = useState("");

  // Trae la lista de proyectos del backend. La llamamos al montar el
  // componente y despues de cada crear/editar/borrar para mantener la
  // lista sincronizada con la base de datos.
  async function cargarProyectos() {
    try {
      const datos = await listarProyectos();
      setProyectos(datos);
    } catch (err) {
      setError(err.message);
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

  async function manejarEliminar(id) {
    setError("");
    try {
      await eliminarProyecto(id);
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
        {proyectos.map((proyecto) => (
          <li key={proyecto.id}>
            <div>
              <strong>{proyecto.nombre}</strong>
              {proyecto.descripcion && <p>{proyecto.descripcion}</p>}
            </div>
            <div className="acciones">
              <button onClick={() => empezarEdicion(proyecto)}>Editar</button>
              <button onClick={() => manejarEliminar(proyecto.id)}>Eliminar</button>
            </div>
          </li>
        ))}
        {proyectos.length === 0 && <p>Todavia no hay proyectos cargados.</p>}
      </ul>
    </section>
  );
}

export default ProyectosPage;
