// Pantalla que se muestra SOLO si el backend tarda en responder al
// arrancar la app (ver App.jsx: se le da un margen de gracia de unos
// segundos antes de mostrar esto, para no hacerla parpadear en cargas
// normales). Pensada para el "cold start" del free tier de Render: el
// server gratuito se duerme solo a los ~15 min sin uso, y la primera
// request despues de eso puede tardar 30-60 segundos en contestar
// mientras el contenedor se levanta de nuevo.
//
// En vez de una barra de progreso seria (que ademas seria mentira,
// porque no tenemos forma de saber cuanto falta), la idea es hacer un
// chiste de que "no sabemos por que tarda" mientras insistimos en que
// hay que esperar - le baja la ansiedad a quien este mirando una
// pantalla en blanco sin explicacion.
import { useEffect, useState } from "react";

const EXCUSAS = [
  "Convenciendo al servidor de que se despierte...",
  "No, no se rompió nada. Bueno, eso creemos.",
  "Consultando a un oráculo por qué tarda tanto...",
  "Che, dale, ya casi arranca...",
  "Esto nunca tarda tanto. Bueno, a veces sí.",
  "El servidor gratuito se queda dormido si nadie lo usa. Ahora se está despertando.",
];

function DespertandoBackend() {
  const [indiceExcusa, setIndiceExcusa] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceExcusa((actual) => (actual + 1) % EXCUSAS.length);
    }, 3000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="pantalla-espera">
      <section className="tarjeta-espera">
        <span className="espera-spinner" aria-hidden="true" />
        <h2>Che, esperá un toque...</h2>
        <p className="subtitulo">{EXCUSAS[indiceExcusa]}</p>
        <p className="espera-detalle">
          (Posta: el hosting gratuito duerme el servidor cuando nadie lo usa. No es que esté colgado, se está
          despertando. Dale unos segundos más.)
        </p>
      </section>
    </div>
  );
}

export default DespertandoBackend;
