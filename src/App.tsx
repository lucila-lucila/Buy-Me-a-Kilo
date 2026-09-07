import { copy } from './copy'
import { STRAINING_FROM_KG } from './config/suitcase'
import { useKilos } from './lib/useKilos'
import { Suitcase } from './components/Suitcase'
import { KiloCounter } from './components/KiloCounter'
import { SuitcaseBar } from './components/SuitcaseBar'
import { RotatingLine } from './components/RotatingLine'
import { TierGrid } from './components/TierGrid'
import { StickerMarquee } from './components/StickerMarquee'
import { Footer } from './components/Footer'
import { Grain } from './components/Grain'
import { Glow } from './components/Glow'

/** Menos de una semana: la cuenta regresiva pasa a color de acento. */
const URGENT_DAYS = 7

export default function App() {
  const { data, stale } = useKilos()

  const capacity = data?.suitcaseCapacity ?? 23
  const inCurrent = data?.kilosInCurrent ?? 0
  const number = data?.suitcaseNumber ?? 1
  const days = data?.daysRemaining ?? 0
  const departed = data?.departed ?? false

  // Una valija a punto de cerrarse es el único momento en que está de verdad al
  // límite: ahí hereda la coreografía de derrame. Se repite cada 23 kilos.
  const straining = !departed && data !== null && inCurrent >= STRAINING_FROM_KG
  const glow = 0.35 + (inCurrent / capacity) * 0.65 + (straining ? 0.3 : 0)

  const urgent = !departed && days > 0 && days < URGENT_DAYS

  // Lo que falta para cerrar la valija en curso. Es lo mismo que mide la barra.
  const toGo = Math.max(0, capacity - inCurrent)

  const rotating = [
    ...(data !== null ? [copy.rotating.people(data.totalPeople)] : []),
    ...(number > 1 ? [copy.rotating.packed(number - 1)] : []),
    copy.rotating.origin,
    copy.rotating.next,
  ]

  return (
    <>
      <Glow intensity={glow} />
      <Grain />
      <main className="page">
        <section className="hero">
          <h1 className="hero__title">{copy.hero.title}</h1>

          <Suitcase ratio={inCurrent / capacity} overweight={straining} />

          <p className="hero__suitcase">{copy.suitcase.label(number)}</p>

          <div className="counter">
            {data !== null && (
              <KiloCounter total={toGo} unit={copy.suitcase.toGoUnit(toGo)} stale={stale} />
            )}
            <SuitcaseBar kilos={inCurrent} capacity={capacity} straining={straining} />
          </div>

          {/* Fija y visible: es lo que crea urgencia y no puede esconderse seis
              segundos de cada veinticuatro dentro de la rotativa. */}
          <p className={`countdown${urgent ? ' countdown--soon' : ''}`}>
            {departed ? copy.departed.line : copy.countdown.line(days)}
          </p>

          <RotatingLine lines={rotating} frozen={departed} />

          <p className="hero__lead">{copy.hero.lead}</p>

          <TierGrid />
        </section>

        <p className="hero__prose">
          {copy.hero.prose(number).map((line, i, all) => (
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
