import { copy } from './copy'
import { useKilos } from './lib/useKilos'
import { Rise } from './components/Rise'
import { Play } from './components/Play'
import { Meter } from './components/Meter'
import { Countdown } from './components/Countdown'
import { Footer } from './components/Footer'
import { Grain } from './components/Grain'
import { Glow } from './components/Glow'

/**
 * Una sola columna centrada.
 *
 *   título · misión · el juego · el botón
 *   la valija chica y la cuenta regresiva · privacidad · pie
 *
 * El juego ya no está escondido detrás de un link: es la pantalla. Kilo dejó de
 * ser la decoración del contador y pasó a ser el personaje que se vuela, y la
 * valija bajó a medidor. El storytelling queda en tres lugares y nada más: la
 * línea de misión, la de destino y el pie.
 *
 * Acá no hay ningún estado que se mueva solo, y eso es deliberado: esta función
 * se vuelve a renderizar una vez cada treinta segundos, cuando llega el fetch.
 * El segundero de la cuenta regresiva y la subida del medidor tienen cada uno
 * su propio componente, así que ninguno de los dos llega hasta el juego.
 */
export default function App() {
  const { data, stale, clock } = useKilos()

  const percent = data?.percentFull ?? 0
  const overweight = percent > 100
  const glow = 0.35 + Math.min(1, percent / 100) * 0.65 + (overweight ? 0.3 : 0)

  return (
    <>
      <Glow intensity={glow} />
      <Grain />
      <main className="page">
        {/* El hero es el título, el juego y el botón. Tiene que entrar sin
            scroll en 360x640: si algo no entra, lo que se achica es el juego. */}
        <section className="hero">
          <h1 className="hero__title">{copy.hero.title}</h1>

          <p className="hero__mission">{copy.hero.mission}</p>

          <Play />
        </section>

        {/* Las métricas y la cuenta regresiva en un solo bloque: en desktop una
            fila, la barra a la izquierda y la cuenta a la derecha; en un
            teléfono se apilan. */}
        <div className="stats">
          <Meter data={data} stale={stale} />
          <Countdown clock={clock} />
        </div>

        {/* Lo de abajo entra al scrollear, escalonado. El hero no: está a la
            vista de entrada y aparecer con retraso lo haría ver roto. */}
        <Rise>
          <p className="privacy">{copy.privacy.line}</p>
        </Rise>

        <Rise delay={120}>
          <Footer />
        </Rise>
      </main>
    </>
  )
}
