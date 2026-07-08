// Pagina de Usuarios: mismo esquema que ProyectosPage (CRUD simple),
// pero con nombre + email en vez de nombre + descripcion.
import { useEffect, useState } from "react";
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../api/usuariosApi";
import Mensaje from "./Mensaje";
import { obtenerIniciales, obtenerVarianteAvatar } from "../utils/avatar";

const FORM_VACIO = { nombre: "", email: "" };

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [error, setError] = useState("");

  async function cargarUsuarios() {
    try {
      const datos = await listarUsuarios();
      setUsuarios(datos);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargarUsuarios();
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
        await actualizarUsuario(idEnEdicion, form);
      } else {
        await crearUsuario(form);
      }
      setForm(FORM_VACIO);
      setIdEnEdicion(null);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  function empezarEdicion(usuario) {
    setIdEnEdicion(usuario.id);
    setForm({ nombre: usuario.nombre, email: usuario.email });
  }

  function cancelarEdicion() {
    setIdEnEdicion(null);
    setForm(FORM_VACIO);
  }

  async function manejarEliminar(id) {
    setError("");
    try {
      await eliminarUsuario(id);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="encabezado-seccion">
        <h2>Usuarios</h2>
        <p className="subtitulo">Las personas que después vas a poder asignar a las tareas de cada proyecto.</p>
      </div>

      <form className="formulario" onSubmit={manejarSubmit}>
        <div className="campo">
          <label htmlFor="nombre-usuario">Nombre</label>
          <input
            id="nombre-usuario"
            name="nombre"
            placeholder="Nombre y apellido"
            value={form.nombre}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="campo campo-ancho">
          <label htmlFor="email-usuario">Email</label>
          <input
            id="email-usuario"
            name="email"
            type="email"
            placeholder="nombre@ejemplo.com"
            value={form.email}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="campo campo-boton">
          <button type="submit">{idEnEdicion ? "Guardar cambios" : "Crear usuario"}</button>
          {idEnEdicion && (
            <button type="button" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <Mensaje texto={error} />

      <ul className="lista">
        {usuarios.map((usuario) => (
          <li key={usuario.id}>
            <div className="fila-usuario">
              <span className={`avatar ${obtenerVarianteAvatar(usuario.nombre)}`} aria-hidden="true">
                {obtenerIniciales(usuario.nombre)}
              </span>
              <div>
                <strong>{usuario.nombre}</strong>
                <p className="dato-mono">{usuario.email}</p>
              </div>
            </div>
            <div className="acciones">
              <button onClick={() => empezarEdicion(usuario)}>Editar</button>
              <button onClick={() => manejarEliminar(usuario.id)}>Eliminar</button>
            </div>
          </li>
        ))}
        {usuarios.length === 0 && <p>Todavia no hay usuarios cargados.</p>}
      </ul>
    </section>
  );
}

export default UsuariosPage;
