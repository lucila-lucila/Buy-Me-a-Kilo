import { copy } from './copy'
import { useKilos } from './lib/useKilos'
import { useIntroCount } from './lib/useIntroCount'
import { Rise } from './components/Rise'
import { Scene } from './components/Scene'
import { KiloCounter } from './components/KiloCounter'
import { SuitcaseBar } from './components/SuitcaseBar'
import { Countdown } from './components/Countdown'
import { SupportButton } from './components/SupportButton'
import { Footer } from './components/Footer'
import { Grain } from './components/Grain'
import { Glow } from './components/Glow'

/**
 * Una sola columna centrada, con aire.
 *
 *   título · misión · destino · Kilo con la valija detrás · número · barra
 *   métricas · cuenta regresiva · botón · gramos · acceso a los juegos
 *
 * Los juegos no viven acá: viven detrás de un botón, en una capa por encima. La
 * página es minimalista y los juegos son opcionales, escondidos a un clic.
 *
 * Acá no hay ningún estado que se mueva solo: esta función se vuelve a
 * renderizar una vez cada treinta segundos, cuando llega el fetch. La cuenta
 * regresiva tiene su propio tick adentro de su componente.
 */
export default function App() {
  const { data, stale, clock } = useKilos()

  // Al cargar, el número y el nivel suben desde cero. Después siguen el valor
  // real: cuando alguien aporta, el contador va de 1,3 a 1,4, no vuelve a
  // empezar. La barra sube sola con su transición de CSS, misma duración.
  const percent = useIntroCount(data?.percentFull ?? null)
  const kilos = useIntroCount(data?.kilosTotal ?? null)

  // Solo puede pasar una vez: cuando la valija pase los 23 kilos. Se mira el
  // valor real y no el de la subida, que arranca en cero.
  const overweight = (data?.percentFull ?? 0) > 100
  const glow = 0.35 + Math.min(1, percent / 100) * 0.65 + (overweight ? 0.3 : 0)

  return (
    <>
      <Glow intensity={glow} />
      <Grain />
      <main className="page">
        <section className="hero">
          <h1 className="hero__title">{copy.hero.title}</h1>

          <p className="hero__mission">
            {copy.hero.mission}
            <br />
            {copy.hero.next}
          </p>

          {/* El nivel sale del mismo percentFull que la barra y los números. */}
          <Scene ratio={percent / 100} overweight={overweight} />

          <div className="counter">
            {data !== null && (
              <KiloCounter
                total={kilos}
                unit={copy.suitcase.ofCapacity(data.capacityKilos)}
                stale={stale}
              />
            )}
            <SuitcaseBar percent={percent} overweight={overweight} />
            {data !== null && (
              <p className="counter__detail" aria-live="polite">
                {copy.suitcase.detail(data.gramsTotal, data.peopleTotal)}
              </p>
            )}
          </div>

          <Countdown clock={clock} />

          {/* El botón, con la línea de los gramos pegada abajo. */}
          <SupportButton />
        </section>

        {/* Lo de abajo entra al scrollear, escalonado. El hero no: está a la
            vista de entrada y aparecer con retraso lo haría ver roto. */}
        <Rise>
          <p className="privacy">
            {copy.privacy.lines.map((line, i) => (
              <span key={line}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </p>
        </Rise>

        <Rise delay={120}>
          <Footer />
        </Rise>
      </main>
    </>
  )
}
