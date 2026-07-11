// Pagina de Dashboard: metricas agregadas para ADMIN (todo el sistema)
// y PM (sus proyectos y su equipo). No pide nada nuevo al backend: usa
// los mismos GET /proyectos, /tareas y /usuarios (o /usuarios/equipo
// para PM) que ya usan ProyectosPage/TareasPage/UsuariosPage, y calcula
// todo en el cliente con useMemo - mismo patron que la barra de
// progreso de ProyectosPage.jsx, solo que agregado a nivel de rol en
// vez de por proyecto individual.
import { useCallback, useEffect, useMemo, useState } from "react";
import { listarProyectos } from "../api/proyectosApi";
import { listarTareas } from "../api/tareasApi";
import { listarUsuarios, obtenerEquipo } from "../api/usuariosApi";
import Mensaje from "./Mensaje";
import Skeleton from "./Skeleton";
import { calcularEstadoFecha } from "../utils/fecha";
import { obtenerIniciales, obtenerVarianteAvatar } from "../utils/avatar";

// Ventana de tiempo para "actividad reciente". Las tareas creadas
// antes de sumar este campo al modelo tienen fechaCreacion=null y
// simplemente no cuentan (no son "recientes" ni "viejas", no hay dato).
const DIAS_RECIENTE = 7;

function esReciente(fechaCreacionIso) {
  if (!fechaCreacionIso) return false;
  const diffMs = Date.now() - new Date(fechaCreacionIso).getTime();
  return diffMs >= 0 && diffMs <= DIAS_RECIENTE * 24 * 60 * 60 * 1000;
}

function estaVencida(tarea) {
  return calcularEstadoFecha(tarea.fechaLimite, tarea.columna?.esFinal)?.variante === "vencida";
}

function DashboardPage({ usuario }) {
  const esAdmin = usuario.rol === "ADMIN";

  const [proyectos, setProyectos] = useState([]);
  const [tareas, setTareas] = useState([]);
  // ADMIN: todos los usuarios del sistema. PM: su equipo (obtenerEquipo()
  // ya incluye al propio PM, ver UsuarioService.listarEquipoDe en el backend).
  const [personas, setPersonas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [proyectosData, tareasData, personasData] = await Promise.all([
        listarProyectos(),
        listarTareas(),
        esAdmin ? listarUsuarios() : obtenerEquipo(),
      ]);
      setProyectos(proyectosData);
      setTareas(tareasData);
      setPersonas(personasData);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [esAdmin]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stats = useMemo(() => {
    // "proyectos" (lo que devuelve GET /proyectos) ya viene filtrado
    // por rol: para ADMIN es TODO, para PM son solo los suyos. Por eso
    // acá no hace falta re-filtrar proyectos por dueño, pero "tareas"
    // (GET /tareas) sí trae todo sin filtrar, y hay que acotarla a los
    // proyectos visibles para no mezclar tareas de proyectos ajenos en
    // las metricas de un PM.
    const idsProyectosVisibles = new Set(proyectos.map((p) => p.id));
    const tareasVisibles = tareas.filter((t) => idsProyectosVisibles.has(t.proyecto?.id));

    const totalTareas = tareasVisibles.length;
    const completadas = tareasVisibles.filter((t) => t.columna?.esFinal).length;
    const porcentaje = totalTareas === 0 ? 0 : Math.round((completadas / totalTareas) * 100);
    const vencidas = tareasVisibles.filter(estaVencida);
    const sinAsignar = tareasVisibles.filter((t) => (t.usuariosAsignados?.length ?? 0) === 0);
    const recientes = tareasVisibles.filter((t) => esReciente(t.fechaCreacion));

    if (esAdmin) {
      const porRol = { ADMIN: 0, PM: 0, USER: 0 };
      for (const u of personas) porRol[u.rol] = (porRol[u.rol] ?? 0) + 1;

      const pms = personas.filter((u) => u.rol === "PM");
      const equiposPorPm = pms.map((pm) => ({
        pm,
        proyectos: proyectos.filter((p) => p.creadoPor?.id === pm.id).length,
        integrantes: personas.filter((u) => u.pmAsignado?.id === pm.id).length,
      }));

      const usuariosSinPm = personas.filter((u) => u.rol === "USER" && !u.pmAsignado);

      return {
        totalProyectos: proyectos.length,
        totalTareas,
        totalUsuarios: personas.length,
        porRol,
        porcentaje,
        vencidas,
        equiposPorPm,
        usuariosSinPm,
        recientes,
      };
    }

    // PM: carga de trabajo por integrante del equipo (cuantas tareas de
    // SUS proyectos tiene asignadas cada uno, el propio PM incluido).
    const cargaPorIntegrante = personas
      .map((persona) => ({
        persona,
        cantidad: tareasVisibles.filter((t) => t.usuariosAsignados?.some((u) => u.id === persona.id)).length,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
    const maxCarga = Math.max(1, ...cargaPorIntegrante.map((c) => c.cantidad));

    return {
      totalProyectos: proyectos.length,
      totalTareas,
      tamanoEquipo: personas.length,
      porcentaje,
      vencidas,
      sinAsignar,
      recientes,
      cargaPorIntegrante,
      maxCarga,
    };
  }, [proyectos, tareas, personas, esAdmin]);

  if (cargando) {
    return (
      <section>
        <div className="encabezado-seccion">
          <h2>Dashboard</h2>
        </div>
        <div className="dashboard-grid">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div className="dashboard-tarjeta" key={indice}>
              <Skeleton width="60%" height="12px" />
              <Skeleton className="skeleton-linea" width="40%" height="28px" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="encabezado-seccion">
        <h2>Dashboard</h2>
        <p className="subtitulo">
          {esAdmin
            ? "Un resumen de todo el sistema: proyectos, tareas, equipos y usuarios."
            : "Un resumen de tus proyectos y tu equipo."}
        </p>
      </div>

      <Mensaje texto={error} />

      <div className="dashboard-grid">
        <div className="dashboard-tarjeta">
          <span className="dashboard-etiqueta">{esAdmin ? "Proyectos totales" : "Tus proyectos"}</span>
          <span className="dashboard-numero dato-mono">{stats.totalProyectos}</span>
        </div>
        <div className="dashboard-tarjeta">
          <span className="dashboard-etiqueta">Tareas</span>
          <span className="dashboard-numero dato-mono">{stats.totalTareas}</span>
        </div>
        {esAdmin ? (
          <div className="dashboard-tarjeta">
            <span className="dashboard-etiqueta">Usuarios</span>
            <span className="dashboard-numero dato-mono">{stats.totalUsuarios}</span>
            <span className="dashboard-detalle dato-mono">
              {stats.porRol.ADMIN} admin · {stats.porRol.PM} pm · {stats.porRol.USER} user
            </span>
          </div>
        ) : (
          <div className="dashboard-tarjeta">
            <span className="dashboard-etiqueta">Tu equipo</span>
            <span className="dashboard-numero dato-mono">{stats.tamanoEquipo}</span>
          </div>
        )}
        <div className="dashboard-tarjeta">
          <span className="dashboard-etiqueta">Creadas en los últimos {DIAS_RECIENTE} días</span>
          <span className="dashboard-numero dato-mono">{stats.recientes.length}</span>
        </div>
      </div>

      <div className="dashboard-tarjeta dashboard-tarjeta-ancha">
        <span className="dashboard-etiqueta">Progreso {esAdmin ? "global" : "de tus proyectos"}</span>
        <div className="proyecto-progreso">
          <div
            className="proyecto-progreso-barra"
            role="progressbar"
            aria-valuenow={stats.porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="proyecto-progreso-relleno" style={{ width: `${stats.porcentaje}%` }} />
          </div>
          <div className="proyecto-progreso-meta">
            <span className="dato-mono">{stats.porcentaje}% completado</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-listas">
        <div className="dashboard-tarjeta">
          <span className="dashboard-etiqueta">Tareas vencidas ({stats.vencidas.length})</span>
          {stats.vencidas.length === 0 ? (
            <p className="dashboard-vacio">Ninguna, buen trabajo.</p>
          ) : (
            <ul className="dashboard-lista">
              {stats.vencidas.slice(0, 5).map((tarea) => (
                <li key={tarea.id}>
                  <span>{tarea.titulo}</span>
                  <span className="dashboard-lista-meta dato-mono">{tarea.proyecto?.nombre}</span>
                </li>
              ))}
              {stats.vencidas.length > 5 && <li className="dashboard-lista-mas">+{stats.vencidas.length - 5} más</li>}
            </ul>
          )}
        </div>

        {esAdmin ? (
          <div className="dashboard-tarjeta">
            <span className="dashboard-etiqueta">Usuarios sin PM asignado ({stats.usuariosSinPm.length})</span>
            {stats.usuariosSinPm.length === 0 ? (
              <p className="dashboard-vacio">Todos tienen un PM asignado.</p>
            ) : (
              <ul className="dashboard-lista">
                {stats.usuariosSinPm.slice(0, 5).map((usuario) => (
                  <li key={usuario.id}>
                    <span>{usuario.nombre}</span>
                    <span className="dashboard-lista-meta dato-mono">{usuario.email}</span>
                  </li>
                ))}
                {stats.usuariosSinPm.length > 5 && (
                  <li className="dashboard-lista-mas">+{stats.usuariosSinPm.length - 5} más</li>
                )}
              </ul>
            )}
          </div>
        ) : (
          <div className="dashboard-tarjeta">
            <span className="dashboard-etiqueta">Tareas sin asignar ({stats.sinAsignar.length})</span>
            {stats.sinAsignar.length === 0 ? (
              <p className="dashboard-vacio">Todas las tareas tienen a alguien asignado.</p>
            ) : (
              <ul className="dashboard-lista">
                {stats.sinAsignar.slice(0, 5).map((tarea) => (
                  <li key={tarea.id}>
                    <span>{tarea.titulo}</span>
                    <span className="dashboard-lista-meta dato-mono">{tarea.proyecto?.nombre}</span>
                  </li>
                ))}
                {stats.sinAsignar.length > 5 && (
                  <li className="dashboard-lista-mas">+{stats.sinAsignar.length - 5} más</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {esAdmin ? (
        <div className="dashboard-tarjeta dashboard-tarjeta-ancha">
          <span className="dashboard-etiqueta">Equipos por PM</span>
          {stats.equiposPorPm.length === 0 ? (
            <p className="dashboard-vacio">Todavía no hay ningún PM designado.</p>
          ) : (
            <ul className="dashboard-lista dashboard-lista-equipos">
              {stats.equiposPorPm.map(({ pm, proyectos, integrantes }) => (
                <li key={pm.id}>
                  <span
                    className={`avatar avatar-chico ${obtenerVarianteAvatar(pm.nombre)}`}
                    aria-hidden="true"
                  >
                    {obtenerIniciales(pm.nombre)}
                  </span>
                  <span className="dashboard-equipo-nombre">{pm.nombre}</span>
                  <span className="dashboard-lista-meta dato-mono">
                    {proyectos} proyecto{proyectos === 1 ? "" : "s"} · {integrantes} integrante
                    {integrantes === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="dashboard-tarjeta dashboard-tarjeta-ancha">
          <span className="dashboard-etiqueta">Carga de trabajo por integrante</span>
          {stats.cargaPorIntegrante.length === 0 ? (
            <p className="dashboard-vacio">Todavía no hay nadie en el equipo.</p>
          ) : (
            <ul className="dashboard-lista dashboard-lista-carga">
              {stats.cargaPorIntegrante.map(({ persona, cantidad }) => (
                <li key={persona.id}>
                  <span
                    className={`avatar avatar-chico ${obtenerVarianteAvatar(persona.nombre)}`}
                    aria-hidden="true"
                  >
                    {obtenerIniciales(persona.nombre)}
                  </span>
                  <span className="dashboard-equipo-nombre">{persona.nombre}</span>
                  <div className="dashboard-carga-barra">
                    <div
                      className="dashboard-carga-relleno"
                      style={{ width: `${(cantidad / stats.maxCarga) * 100}%` }}
                    />
                  </div>
                  <span className="dashboard-lista-meta dato-mono">{cantidad}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
