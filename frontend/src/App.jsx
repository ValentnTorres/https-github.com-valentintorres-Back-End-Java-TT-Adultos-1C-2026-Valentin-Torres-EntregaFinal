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
import "./App.css";

const PESTANAS = [
  { id: "proyectos", etiqueta: "Proyectos" },
  { id: "usuarios", etiqueta: "Usuarios" },
  { id: "tareas", etiqueta: "Tareas" },
];

function App() {
  const [pestanaActiva, setPestanaActiva] = useState("proyectos");

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
      </header>

      <main className="app-main">
        {pestanaActiva === "proyectos" && <ProyectosPage />}
        {pestanaActiva === "usuarios" && <UsuariosPage />}
        {pestanaActiva === "tareas" && <TareasPage />}
      </main>
    </div>
  );
}

export default App;
