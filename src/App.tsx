import { copy } from './copy'
import { STRAINING_FROM_KG } from './config/suitcase'
import { useKilos } from './lib/useKilos'
import { Suitcase } from './components/Suitcase'
import { KiloCounter } from './components/KiloCounter'
import { SuitcaseBar } from './components/SuitcaseBar'
import { TierGrid } from './components/TierGrid'
import { StickerMarquee } from './components/StickerMarquee'
import { Footer } from './components/Footer'
import { Grain } from './components/Grain'
import { Glow } from './components/Glow'

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
  // Recién estrenada: la anterior acaba de cerrarse.
  const justOpened = data !== null && inCurrent === 0 && data.totalKilos > 0

  const glow = 0.35 + (inCurrent / capacity) * 0.65 + (straining ? 0.3 : 0)

  const suitcaseNote = justOpened
    ? copy.suitcase.justClosed(number)
    : number === 1
      ? copy.suitcase.noteFirst
      : copy.suitcase.note(number)

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
            {data !== null && <KiloCounter total={data.totalKilos} stale={stale} />}
            <SuitcaseBar
              kilos={inCurrent}
              capacity={capacity}
              straining={straining}
              note={suitcaseNote}
            />
          </div>

          {data !== null && (
            <p className="people">
              <b>{copy.people.count(data.totalPeople)}</b>
              <span>{copy.people.note}</span>
            </p>
          )}

          <p className={`countdown${!departed && days < 14 ? ' countdown--soon' : ''}`}>
            {departed ? copy.departed.line : copy.countdown.line(days)}
          </p>

          <p className="hero__lead">{copy.hero.lead}</p>

          <TierGrid />
        </section>

        <p className="hero__prose">
          {copy.hero.prose.map((line, i) => (
            <span key={line}>
              {line.replace('{when}', copy.countdown.inline(days))}
              {i < copy.hero.prose.length - 1 && <br />}
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
