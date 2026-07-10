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
import Skeleton from "./Skeleton";
import { obtenerIniciales, obtenerVarianteAvatar } from "../utils/avatar";

const FORM_VACIO = { nombre: "", email: "", password: "" };
// Solo 1 fila esqueleto (ver el mismo comentario en ProyectosPage.jsx):
// mostrar varias y despues encontrarse con menos usuarios reales hace
// que la lista se encoja de golpe al terminar de cargar.
const FILAS_ESQUELETO = 1;

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  async function cargarUsuarios() {
    try {
      const datos = await listarUsuarios();
      setUsuarios(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
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
    // La password no se edita aca (el backend la ignora en el PUT), asi
    // que el campo directamente no se muestra en modo edicion.
    setForm({ nombre: usuario.nombre, email: usuario.email, password: "" });
  }

  function cancelarEdicion() {
    setIdEnEdicion(null);
    setForm(FORM_VACIO);
  }

  async function manejarEliminar(usuario) {
    const confirmado = window.confirm(`¿Eliminar a "${usuario.nombre}"?`);
    if (!confirmado) return;

    setError("");
    try {
      await eliminarUsuario(usuario.id);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="encabezado-seccion">
        <h2>Usuarios</h2>
        <p className="subtitulo">
          Las personas que después vas a poder asignar a las tareas de cada proyecto. Cada usuario es también una
          cuenta con la que se puede iniciar sesión.
        </p>
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
        {!idEnEdicion && (
          <div className="campo campo-ancho">
            <label htmlFor="password-usuario">Contraseña</label>
            <input
              id="password-usuario"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={manejarCambio}
              required
              minLength={6}
            />
          </div>
        )}
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
        {cargando &&
          Array.from({ length: FILAS_ESQUELETO }).map((_, indice) => (
            <li key={indice}>
              <div className="fila-usuario">
                <Skeleton circulo width="36px" height="36px" />
                <div>
                  <Skeleton width="140px" height="16px" />
                  <Skeleton className="skeleton-linea" width="180px" height="12px" />
                </div>
              </div>
              <div className="acciones">
                <Skeleton width="64px" height="34px" />
                <Skeleton width="74px" height="34px" />
              </div>
            </li>
          ))}

        {!cargando &&
          usuarios.map((usuario) => (
            <li key={usuario.id} className="fade-in-suave">
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
                <button onClick={() => manejarEliminar(usuario)}>Eliminar</button>
              </div>
            </li>
          ))}
        {!cargando && usuarios.length === 0 && <p className="fade-in-suave">Todavia no hay usuarios cargados.</p>}
      </ul>
    </section>
  );
}

export default UsuariosPage;
