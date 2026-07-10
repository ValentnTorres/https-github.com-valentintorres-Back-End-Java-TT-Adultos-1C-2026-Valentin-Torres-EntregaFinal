// Pantalla que se muestra SOLO si el backend tarda en responder al
// arrancar la app (ver App.jsx: se le da un margen de gracia de unos
// segundos antes de mostrar esto, para no hacerla parpadear en cargas
// normales). Pensada para el "cold start" del free tier de Render: el
// server gratuito se duerme solo a los ~15 min sin uso, y la primera
// request despues de eso puede tardar 30-60 segundos en contestar
// mientras el contenedor se levanta de nuevo.
//
// En vez de una barra de progreso seria (que ademas seria mentira,
// porque no tenemos forma de saber cuanto falta), la idea es un emoji
// gigante que va cambiando de cara (como la Esfera de Las Vegas) con
// un globo de dialogo arriba, haciendo el chiste de que "no sabemos
// por que tarda" mientras insistimos en que hay que esperar.
import { useEffect, useState } from "react";

const FRASES = [
  { cara: "😐", texto: "Convenciendo al servidor de que se despierte..." },
  { cara: "😅", texto: "No, no se rompió nada. Bueno, eso creemos." },
  { cara: "🤔", texto: "Consultando a un oráculo por qué tarda tanto..." },
  { cara: "😤", texto: "Che, dale, ya casi arranca..." },
  { cara: "🙄", texto: "Esto nunca tarda tanto. Bueno, a veces sí." },
  { cara: "😴", texto: "El servidor gratuito se queda dormido si nadie lo usa. Ahora se está despertando." },
];

function DespertandoBackend() {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((actual) => (actual + 1) % FRASES.length);
    }, 3000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="pantalla-espera">
      <section className="tarjeta-espera">
        <h2>Hola Profesor, lamento que tenga que esperar</h2>

        <div className="esfera-contenedor">
          <div className="globo-dialogo">{FRASES[indice].texto}</div>
          <span className="esfera-emoji" aria-hidden="true">
            {FRASES[indice].cara}
          </span>
        </div>

        <p className="espera-detalle">
          El hosting gratuito duerme el servidor cuando nadie lo usa, así que en este momento se está despertando.
          En unos segundos debería responder con normalidad.
        </p>
      </section>
    </div>
  );
}

export default DespertandoBackend;
