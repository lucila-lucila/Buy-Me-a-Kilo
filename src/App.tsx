import { copy } from './copy'
import { useKilos } from './lib/useKilos'
import { Suitcase } from './components/Suitcase'
import { KiloCounter } from './components/KiloCounter'
import { SuitcaseBar } from './components/SuitcaseBar'
import { Countdown } from './components/Countdown'
import { SupportButton } from './components/SupportButton'
import { StickerMarquee } from './components/StickerMarquee'
import { Footer } from './components/Footer'
import { Grain } from './components/Grain'
import { Glow } from './components/Glow'

/**
 * El orden del hero es el camino al clic, y nada se mete en el medio:
 *
 *   título · valija · número · barra · métricas · cuenta regresiva
 *   mensaje central · botón · las dos líneas que explican el precio
 *
 * El cierre va después, fuera del hero. El chiste de las doscientas personas
 * estaba entre el mensaje central y el botón y cortaba ese camino: ahora está
 * abajo, donde se lee después de haber entendido qué se compra.
 *
 * La cuenta regresiva es su propio componente porque tickea cada segundo. Acá
 * no hay ningún estado que se mueva solo: esta función se vuelve a renderizar
 * una vez cada treinta segundos, cuando llega el fetch.
 */
export default function App() {
  const { data, stale, clock } = useKilos()

  const percent = data?.percentFull ?? 0

  // Solo puede pasar una vez: cuando la valija pase los 23 kilos.
  const overweight = percent > 100
  const glow = 0.35 + Math.min(1, percent / 100) * 0.65 + (overweight ? 0.3 : 0)

  return (
    <>
      <Glow intensity={glow} />
      <Grain />
      <main className="page">
        <section className="hero">
          <h1 className="hero__title">{copy.hero.title}</h1>

          {/* El nivel sale del mismo percentFull que la barra y los números. */}
          <Suitcase ratio={percent / 100} overweight={overweight} />

          <div className="counter">
            {data !== null && (
              <KiloCounter
                total={data.kilosTotal}
                unit={copy.suitcase.ofCapacity(data.capacityKilos)}
                stale={stale}
              />
            )}
            <SuitcaseBar percent={percent} overweight={overweight} />
            {data !== null && (
              <p className="counter__detail">
                {copy.suitcase.detail(data.gramsTotal, data.peopleTotal, data.percentFull)}
              </p>
            )}
          </div>

          {/* Fija y visible: es lo único que mete presión de tiempo. */}
          <Countdown clock={clock} />

          <p className="hero__lead">{copy.hero.lead}</p>

          <SupportButton />

          {/* La segunda de las dos líneas que explican el precio. La primera
              —cinco dólares son tres gramos— sale pegada al botón. */}
          <p className="hero__joke">{copy.hero.joke}</p>
        </section>

        <p className="hero__prose">
          {copy.hero.prose.map((line, i, all) => (
            <span key={line}>
              {line}
              {i < all.length - 1 && <br />}
            </span>
          ))}
        </p>

        <StickerMarquee />

        <p className="privacy">
          {copy.privacy.lines.map((line, i) => (
            <span key={line}>
              {line}
              {i === 0 && <br />}
            </span>
          ))}
        </p>

        <Footer />
      </main>
    </>
  )
}
