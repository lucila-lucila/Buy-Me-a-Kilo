import { copy } from './copy'
import { URGENT_MS } from './config/countdown'
import { useKilos } from './lib/useKilos'
import { useCountdown } from './lib/useCountdown'
import { Suitcase } from './components/Suitcase'
import { KiloCounter } from './components/KiloCounter'
import { SuitcaseBar } from './components/SuitcaseBar'
import { RotatingLine } from './components/RotatingLine'
import { SupportButton } from './components/SupportButton'
import { StickerMarquee } from './components/StickerMarquee'
import { Footer } from './components/Footer'
import { Grain } from './components/Grain'
import { Glow } from './components/Glow'

export default function App() {
  const { data, stale, clock } = useKilos()
  const countdown = useCountdown(clock)

  const percent = data?.percentFull ?? 0
  const days = data?.daysRemaining ?? 0
  const departed = countdown?.departed ?? data?.departed ?? false

  // Ahora solo puede pasar una vez: cuando la valija pase los 23 kilos.
  const overweight = percent > 100
  const urgent = countdown !== null && !departed && countdown.totalMs < URGENT_MS
  const glow = 0.35 + Math.min(1, percent / 100) * 0.65 + (overweight ? 0.3 : 0)

  const rotating = [copy.rotating.origin, copy.rotating.next]

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

          {/* Fija y visible: es lo que crea urgencia. Mientras no llegó el
              primer fetch queda vacía, pero con la altura ya reservada: no
              tiene sentido anunciar un plazo que todavía no sabemos. */}
          <p className={`countdown${urgent ? ' countdown--soon' : ''}`}>
            {countdown === null ? null : countdown.departed ? (
              copy.countdown.gone
            ) : (
              <>
                {copy.countdown.lead}{' '}
                <b className="countdown__value">{copy.countdown.value(countdown)}</b>
              </>
            )}
          </p>

          <RotatingLine lines={rotating} frozen={departed} />

          <p className="hero__lead">{copy.hero.lead}</p>
          <p className="hero__joke">{copy.hero.joke}</p>

          <SupportButton />
        </section>

        <p className="hero__prose">
          {copy.hero.prose.map((line, i, all) => (
            <span key={line}>
              {line.replace('{when}', copy.countdown.inline(days))}
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
