// Componente raiz de la app.
//
// No usamos react-router: alcanza con un estado simple (pestanaActiva)
// para decidir que "pagina" mostrar. Es un solo estado en memoria, no
// hay URLs distintas por seccion (para una app de este tamano no hace
// falta mas que esto).
import { useState } from "react";
import ProyectosPage from "./components/ProyectosPage";
import UsuariosPage from "./components/UsuariosPage";
import TareasPage from "./components/TareasPage";
import LoginPage from "./components/LoginPage";
import { obtenerSesion, borrarSesion } from "./api/config";
import "./App.css";

const PESTANAS = [
  { id: "proyectos", etiqueta: "Proyectos" },
  { id: "usuarios", etiqueta: "Usuarios" },
  { id: "tareas", etiqueta: "Tareas" },
];

function App() {
  const [pestanaActiva, setPestanaActiva] = useState("proyectos");
  // Si ya hay un token guardado de una visita anterior, arranca logueado.
  const [usuario, setUsuario] = useState(() => obtenerSesion()?.usuario ?? null);

  function cerrarSesion() {
    borrarSesion();
    setUsuario(null);
  }

  if (!usuario) {
    return <LoginPage onLogin={setUsuario} />;
  }

  return (
    <div className="app-shell">
      {/* Header estilo "UI Shell" de Carbon: franja oscura de ancho
          completo, con el nombre de la app y la navegacion en la
          misma linea (no una debajo de la otra). */}
      <header className="carbon-header">
        <div className="carbon-header-marca">
          {/* Marca del producto: las llaves hacen referencia directa al
              JSON que viaja entre este frontend y la API REST de Spring
              Boot, que es el corazon tecnico del proyecto. */}
          <span className="carbon-header-logo" aria-hidden="true">{"{}"}</span>
          <span className="carbon-header-titulo">Gestor de Tareas y Proyectos</span>
        </div>
        <nav className="tabs">
          {PESTANAS.map((pestana) => (
            <button
              key={pestana.id}
              className={pestana.id === pestanaActiva ? "tab tab-activo" : "tab"}
              onClick={() => setPestanaActiva(pestana.id)}
            >
              {pestana.etiqueta}
            </button>
          ))}
        </nav>
        <div className="carbon-header-sesion">
          <span>{usuario.nombre}</span>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {/* El tablero de Tareas usa un modificador aparte (app-main-tablero)
          que saca el max-width/centrado y ocupa todo el ancho y alto
          disponibles: a diferencia de Proyectos/Usuarios (formularios y
          listas angostas), el Kanban aprovecha mejor toda la pantalla. */}
      <main className={pestanaActiva === "tareas" ? "app-main app-main-tablero" : "app-main"}>
        {/* Las 3 paginas quedan montadas todo el tiempo (se ocultan con
            "hidden", no se desmontan). Si en vez de esto renderizaramos
            solo la pestaña activa, cada cambio de pestaña destruiria el
            componente anterior junto con los datos que ya habia
            cargado, obligando a volver a pedirselos a la API (y a
            mostrar el esqueleto) cada vez que volves a una pestaña que
            ya habias visitado. Asi, cada pagina pide sus datos una sola
            vez al arrancar la app, y cambiar de pestaña es instantaneo. */}
        <div hidden={pestanaActiva !== "proyectos"}>
          <ProyectosPage />
        </div>
        <div hidden={pestanaActiva !== "usuarios"}>
          <UsuariosPage />
        </div>
        <div hidden={pestanaActiva !== "tareas"}>
          <TareasPage />
        </div>
      </main>
    </div>
  );
}

export default App;
