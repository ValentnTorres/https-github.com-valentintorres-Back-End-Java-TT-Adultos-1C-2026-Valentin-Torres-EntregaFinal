// Selector de fecha con calendario propio (sin librerias externas,
// para no agregar una dependencia nueva). El <input type="date">
// nativo del navegador se descarto porque su calendario Y su texto
// dependen de la configuracion regional de quien lo usa (en ingles de
// EEUU, por ejemplo, se ve "Month Day, Year"), y eso no se puede
// forzar por CSS. Aca el formato siempre es DD/MM/AAAA, elegido
// clickeando un dia en la grilla, nunca tipeado a mano.
//
// Por fuera se comporta como un input controlado: "value" y lo que
// devuelve "onChange" son siempre fecha ISO (YYYY-MM-DD, el formato
// que espera el backend) - la conversion a DD/MM/AAAA es solo visual,
// interna de este componente.
import { useEffect, useRef, useState } from "react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function isoATexto(iso) {
  if (!iso) return "";
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

function aIso(anio, mesIndice, dia) {
  const mm = String(mesIndice + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${anio}-${mm}-${dd}`;
}

function diasDelMes(anio, mesIndice) {
  return new Date(anio, mesIndice + 1, 0).getDate();
}

// getDay() nativo devuelve 0=domingo..6=sabado; esto lo pasa a
// 0=lunes..6=domingo para que la grilla arranque alineada con DIAS_SEMANA.
function primerDiaSemana(anio, mesIndice) {
  return (new Date(anio, mesIndice, 1).getDay() + 6) % 7;
}

function InputFecha({ id, value, onChange, title }) {
  const [abierto, setAbierto] = useState(false);
  const fechaSeleccionada = value ? new Date(`${value}T00:00:00`) : null;
  const [mesVisible, setMesVisible] = useState(() => fechaSeleccionada ?? new Date());
  const contenedorRef = useRef(null);

  // Cerrar el calendario si se clickea afuera.
  useEffect(() => {
    if (!abierto) return;
    function manejarClickAfuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickAfuera);
    return () => document.removeEventListener("mousedown", manejarClickAfuera);
  }, [abierto]);

  function alternarAbierto() {
    if (!abierto) setMesVisible(fechaSeleccionada ?? new Date());
    setAbierto((actual) => !actual);
  }

  function elegirDia(dia) {
    onChange(aIso(mesVisible.getFullYear(), mesVisible.getMonth(), dia));
    setAbierto(false);
  }

  function cambiarMes(delta) {
    setMesVisible((actual) => new Date(actual.getFullYear(), actual.getMonth() + delta, 1));
  }

  const anio = mesVisible.getFullYear();
  const mesIndice = mesVisible.getMonth();
  const totalDias = diasDelMes(anio, mesIndice);
  const huecosIniciales = primerDiaSemana(anio, mesIndice);
  const celdas = [...Array(huecosIniciales).fill(null), ...Array.from({ length: totalDias }, (_, i) => i + 1)];

  return (
    <div className="input-fecha-contenedor" ref={contenedorRef}>
      <button
        type="button"
        id={id}
        title={title}
        className="input-fecha-boton"
        onClick={alternarAbierto}
      >
        {isoATexto(value) || "DD/MM/AAAA"}
      </button>

      {abierto && (
        <div className="input-fecha-calendario">
          <div className="input-fecha-header">
            <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
              ‹
            </button>
            <span>
              {MESES[mesIndice]} {anio}
            </span>
            <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
              ›
            </button>
          </div>

          <div className="input-fecha-grilla">
            {DIAS_SEMANA.map((nombreDia) => (
              <span key={nombreDia} className="input-fecha-dia-nombre">
                {nombreDia}
              </span>
            ))}
            {celdas.map((dia, indice) =>
              dia ? (
                <button
                  type="button"
                  key={dia}
                  className={`input-fecha-dia${value === aIso(anio, mesIndice, dia) ? " input-fecha-dia--activo" : ""}`}
                  onClick={() => elegirDia(dia)}
                >
                  {dia}
                </button>
              ) : (
                <span key={`hueco-${indice}`} />
              )
            )}
          </div>

          {value && (
            <button
              type="button"
              className="input-fecha-limpiar"
              onClick={() => {
                onChange("");
                setAbierto(false);
              }}
            >
              Quitar fecha
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InputFecha;
