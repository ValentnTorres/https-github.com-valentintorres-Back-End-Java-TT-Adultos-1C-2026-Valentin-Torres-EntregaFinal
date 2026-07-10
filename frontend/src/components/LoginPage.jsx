// Pantalla de login/registro. Se muestra en vez de las pestañas de la
// app cuando no hay una sesion guardada (ver App.jsx).
//
// Incluye tambien el registro (no solo el login): POST /api/usuarios
// es publico en el backend justamente para esto, porque si crear una
// cuenta solo se pudiera hacer desde la pestaña "Usuarios" (que esta
// detras del login), nadie podria entrar la primera vez.
import { useState } from "react";
import { iniciarSesion } from "../api/authApi";
import { crearUsuario } from "../api/usuariosApi";
import Mensaje from "./Mensaje";

const LOGIN_VACIO = { email: "", password: "" };
const REGISTRO_VACIO = { nombre: "", email: "", password: "" };

function LoginPage({ onLogin }) {
  const [modo, setModo] = useState("login"); // "login" | "registro"
  const [formLogin, setFormLogin] = useState(LOGIN_VACIO);
  const [formRegistro, setFormRegistro] = useState(REGISTRO_VACIO);
  const [error, setError] = useState("");

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setError("");
  }

  async function manejarLogin(evento) {
    evento.preventDefault();
    setError("");
    try {
      const usuario = await iniciarSesion(formLogin);
      onLogin(usuario);
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarRegistro(evento) {
    evento.preventDefault();
    setError("");
    try {
      await crearUsuario(formRegistro);
      // Registrado con exito: inicia sesion directamente con esas
      // mismas credenciales para no obligar a tipearlas de nuevo.
      const usuario = await iniciarSesion({ email: formRegistro.email, password: formRegistro.password });
      onLogin(usuario);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="pantalla-login">
      <section className="tarjeta-login">
        <div className="encabezado-seccion">
          <h2>{modo === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
          <p className="subtitulo">
            {modo === "login"
              ? "Ingresá con el email y la contraseña de tu cuenta."
              : "Registrate para poder entrar al tablero."}
          </p>
        </div>

        {modo === "login" ? (
          <form className="formulario" onSubmit={manejarLogin}>
            <div className="campo campo-ancho">
              <label htmlFor="email-login">Email</label>
              <input
                id="email-login"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={formLogin.email}
                onChange={(e) => setFormLogin({ ...formLogin, email: e.target.value })}
                required
              />
            </div>
            <div className="campo campo-ancho">
              <label htmlFor="password-login">Contraseña</label>
              <input
                id="password-login"
                type="password"
                placeholder="••••••"
                value={formLogin.password}
                onChange={(e) => setFormLogin({ ...formLogin, password: e.target.value })}
                required
              />
            </div>
            <div className="campo campo-boton">
              <button type="submit">Ingresar</button>
            </div>
          </form>
        ) : (
          <form className="formulario" onSubmit={manejarRegistro}>
            <div className="campo">
              <label htmlFor="nombre-registro">Nombre</label>
              <input
                id="nombre-registro"
                placeholder="Nombre y apellido"
                value={formRegistro.nombre}
                onChange={(e) => setFormRegistro({ ...formRegistro, nombre: e.target.value })}
                required
              />
            </div>
            <div className="campo campo-ancho">
              <label htmlFor="email-registro">Email</label>
              <input
                id="email-registro"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={formRegistro.email}
                onChange={(e) => setFormRegistro({ ...formRegistro, email: e.target.value })}
                required
              />
            </div>
            <div className="campo campo-ancho">
              <label htmlFor="password-registro">Contraseña</label>
              <input
                id="password-registro"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formRegistro.password}
                onChange={(e) => setFormRegistro({ ...formRegistro, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="campo campo-boton">
              <button type="submit">Crear cuenta</button>
            </div>
          </form>
        )}

        <Mensaje texto={error} />

        <p className="subtitulo">
          {modo === "login" ? (
            <>
              ¿No tenés cuenta?{" "}
              <button type="button" className="enlace" onClick={() => cambiarModo("registro")}>
                Creá una
              </button>
            </>
          ) : (
            <>
              ¿Ya tenés cuenta?{" "}
              <button type="button" className="enlace" onClick={() => cambiarModo("login")}>
                Iniciá sesión
              </button>
            </>
          )}
        </p>
      </section>
    </div>
  );
}

export default LoginPage;
