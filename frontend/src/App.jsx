// Componente raiz de la app.
//
// No usamos react-router: alcanza con un estado simple (pestanaActiva)
// para decidir que "pagina" mostrar. Es un solo estado en memoria, no
// hay URLs distintas por seccion (para una app de este tamano no hace
// falta mas que esto).
import { useEffect, useState } from "react";
import ProyectosPage from "./components/ProyectosPage";
import UsuariosPage from "./components/UsuariosPage";
import TareasPage from "./components/TareasPage";
import DashboardPage from "./components/DashboardPage";
import LoginPage from "./components/LoginPage";
import DespertandoBackend from "./components/DespertandoBackend";
import { API_BASE_URL, obtenerSesion, borrarSesion } from "./api/config";
import "./App.css";

// Ya no hay una pestaña "Tareas" en el menu: cada proyecto es su propio
// tablero aislado (como los boards de Trello), y la unica forma de
// entrar a uno es clickeandolo desde Proyectos (ver "proyectoAbiertoId").
// "roles" filtra que pestañas ve cada quien: sin esa propiedad, la
// pestaña es visible para cualquier rol. "Usuarios" lista a TODA la
// gente del sistema (solo ADMIN); "Dashboard" son metricas agregadas
// que solo le sirven a quien puede crear/gestionar proyectos (ADMIN y PM).
const PESTANAS = [
  { id: "proyectos", etiqueta: "Proyectos" },
  { id: "dashboard", etiqueta: "Dashboard", roles: ["ADMIN", "PM"] },
  { id: "usuarios", etiqueta: "Usuarios", roles: ["ADMIN"] },
];

function pestanasVisiblesPara(usuario) {
  return PESTANAS.filter((pestana) => !pestana.roles || pestana.roles.includes(usuario?.rol));
}

function App() {
  const [pestanaActiva, setPestanaActiva] = useState("proyectos");
  // Si ya hay un token guardado de una visita anterior, arranca logueado.
  const [usuario, setUsuario] = useState(() => obtenerSesion()?.usuario ?? null);
  const [backendListo, setBackendListo] = useState(false);
  const [mostrarEspera, setMostrarEspera] = useState(false);
  // Que proyecto tiene su tablero abierto ahora mismo (null = ninguno,
  // se ven las pestañas normales de Proyectos/Usuarios). Vive aca
  // arriba (no adentro de TareasPage) porque lo setea ProyectosPage al
  // clickear un proyecto: hace falta que ambas paginas compartan este
  // estado a traves del padre comun.
  const [proyectoAbiertoId, setProyectoAbiertoId] = useState(null);

  // Clickear un proyecto en la pestaña "Proyectos" abre su tablero de
  // tareas a pantalla completa, aislado de los demas proyectos.
  function abrirProyecto(proyectoId) {
    setProyectoAbiertoId(proyectoId);
  }

  function volverAProyectos() {
    setProyectoAbiertoId(null);
  }

  function cambiarPestana(pestanaId) {
    setPestanaActiva(pestanaId);
    // Navegar por el menu de arriba (no clickeando un proyecto puntual)
    // te saca de cualquier tablero que tuvieras abierto.
    setProyectoAbiertoId(null);
  }

  // Antes de mostrar login o la app, probamos que el backend responda.
  // En local (o con el backend ya despierto) esto tarda milisegundos y
  // nunca llega a mostrarse nada raro. En Render con el free tier
  // dormido, la primera request puede tardar 30-60s en contestar; le
  // damos un margen de gracia de 2.5s antes de mostrar la pantalla de
  // "esperando" para no hacerla parpadear en cargas normales.
  useEffect(() => {
    const timer = setTimeout(() => setMostrarEspera(true), 2500);

    fetch(`${API_BASE_URL}/proyectos`)
      .catch(() => {}) // no importa si da error o 401, solo que conteste
      .finally(() => {
        clearTimeout(timer);
        setBackendListo(true);
      });

    return () => clearTimeout(timer);
  }, []);

  if (!backendListo) {
    return mostrarEspera ? <DespertandoBackend /> : null;
  }

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
          {pestanasVisiblesPara(usuario).map((pestana) => (
            <button
              key={pestana.id}
              className={!proyectoAbiertoId && pestana.id === pestanaActiva ? "tab tab-activo" : "tab"}
              onClick={() => cambiarPestana(pestana.id)}
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

      {/* El tablero de un proyecto usa un modificador aparte
          (app-main-tablero) que saca el max-width/centrado y ocupa
          todo el ancho y alto disponibles: a diferencia de
          Proyectos/Usuarios (formularios y listas angostas), el
          Kanban aprovecha mejor toda la pantalla. */}
      <main className={proyectoAbiertoId ? "app-main app-main-tablero" : "app-main"}>
        {/* Las 3 paginas quedan montadas todo el tiempo (se ocultan con
            "hidden", no se desmontan). Si en vez de esto renderizaramos
            solo la activa, cada cambio destruiria el componente
            anterior junto con los datos que ya habia cargado,
            obligando a volver a pedirselos a la API (y a mostrar el
            esqueleto) cada vez que volves a algo que ya habias
            visitado. Asi, cada pagina pide sus datos una sola vez al
            arrancar la app, y navegar es instantaneo. */}
        <div hidden={!!proyectoAbiertoId || pestanaActiva !== "proyectos"}>
          <ProyectosPage onVerTareas={abrirProyecto} usuario={usuario} />
        </div>
        {(usuario.rol === "ADMIN" || usuario.rol === "PM") && (
          <div hidden={!!proyectoAbiertoId || pestanaActiva !== "dashboard"}>
            <DashboardPage usuario={usuario} />
          </div>
        )}
        {usuario.rol === "ADMIN" && (
          <div hidden={!!proyectoAbiertoId || pestanaActiva !== "usuarios"}>
            <UsuariosPage />
          </div>
        )}
        <div hidden={!proyectoAbiertoId}>
          <TareasPage proyectoAbiertoId={proyectoAbiertoId} onVolver={volverAProyectos} />
        </div>
      </main>
    </div>
  );
}

export default App;
