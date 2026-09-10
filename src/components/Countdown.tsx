import { copy } from '../copy'
import { URGENT_MS } from '../config/countdown'
import { useCountdown } from '../lib/useCountdown'
import { useReducedMotion } from '../lib/reducedMotion'
import type { Countdown as CountdownState } from '../lib/useCountdown'
import type { Clock } from '../lib/useKilos'

/**
 * La cuenta regresiva, en cuatro cajitas.
 *
 *    41       03       27       16
 *   days    hours   minutes  seconds
 *
 * En cajitas y no en una frase corrida: la frase con los cuatro tramos medía
 * 1400 px y era lo que había roto el ancho de la página. Así los mismos cuatro
 * números entran en cualquier columna.
 *
 * Horas, minutos y segundos van con cero adelante. Acá no se lee como reloj de
 * oferta —es una grilla de números, no una frase— y de paso el ancho de cada
 * cajita no cambia nunca.
 *
 * Con movimiento reducido no hay segundero: quedan días, horas y minutos, y el
 * tick pasa a un minuto.
 *
 * Componente propio por el tick de un segundo: si el estado viviera en App se
 * volverían a renderizar la valija, la barra y los stickers sesenta veces por
 * minuto para mover un dígito.
 */
export function Countdown({ clock }: { clock: Clock | null }) {
  const reduced = useReducedMotion()
  const c = useCountdown(clock, !reduced)

  // Mientras no llegó el primer fetch queda vacía, con la altura ya reservada
  // por CSS: no tiene sentido anunciar un plazo que todavía no sabemos.
  if (c === null) return <div className="countdown" />
  if (c.departed) return <div className="countdown countdown--gone">{copy.countdown.gone}</div>

  const pad = (n: number) => String(n).padStart(2, '0')
  const boxes: [key: string, value: string, label: string][] = [
    ['days', String(c.days), copy.countdown.labels.days],
    ['hours', pad(c.hours), copy.countdown.labels.hours],
    ['minutes', pad(c.minutes), copy.countdown.labels.minutes],
  ]
  if (!reduced) boxes.push(['seconds', pad(c.seconds), copy.countdown.labels.seconds])

  return (
    <div className={`countdown${c.totalMs < URGENT_MS ? ' countdown--soon' : ''}`}>
      <p className="countdown__heading">{copy.countdown.heading}</p>

      {/* Un solo texto para el lector de pantalla, sin segundos y sin live
          region: cuatro números que cambian por segundo son inusables leídos. */}
      <p className="sr-only">{spoken(c)}</p>

      <div className="countdown__boxes" aria-hidden="true">
        {boxes.map(([key, value, label]) => (
          <div className="countdown__box" key={key}>
            {/* La key es el valor: al cambiar, React reemplaza el nodo y la
                animación de entrada arranca de nuevo. Sin eso el número salta
                de golpe. */}
            <span className="countdown__n" key={value}>
              {value}
            </span>
            <span className="countdown__label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function spoken(c: CountdownState): string {
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
  return `${copy.countdown.heading}: ${plural(c.days, 'day')}, ${plural(c.hours, 'hour')} and ${plural(c.minutes, 'minute')}`
}
