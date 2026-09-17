import { copy } from '../copy'
import { URGENT_MS } from '../config/countdown'
import { useCountdown } from '../lib/useCountdown'
import type { Countdown as CountdownState } from '../lib/useCountdown'
import type { Clock } from '../lib/useKilos'

/**
 * La cuenta regresiva, en cuatro cajitas.
 *
 *    39       12       48       07
 *   days    hours   minutes  seconds
 *
 * En cajitas y no en una frase corrida: la frase con los cuatro tramos medía
 * 1400 px y era lo que había roto el ancho de la página.
 *
 * Horas, minutos y segundos van con cero adelante. Acá no se lee como reloj de
 * oferta —es una grilla de números, no una frase— y de paso el ancho de cada
 * cajita no cambia nunca.
 *
 * Componente propio, y eso es lo que hace que el segundero sea posible: el tick
 * vuelve a renderizar esta función y nada más. El juego está en la misma
 * pantalla y no se entera.
 */
export function Countdown({ clock }: { clock: Clock | null }) {
  const c = useCountdown(clock)

  // Mientras no llegó el primer fetch queda vacía, con la altura ya reservada
  // por CSS: no tiene sentido anunciar un plazo que todavía no sabemos.
  if (c === null) return <div className="countdown" />
  if (c.departed) return <div className="countdown countdown--gone">{copy.countdown.gone}</div>

  const pad = (n: number) => String(n).padStart(2, '0')
  // El último campo es el que cambia una vez por segundo y es el único que no
  // entra con fundido: un fundido de 340 ms sobre un número que dura mil se ve
  // como un parpadeo, no como una transición.
  const boxes: [key: string, value: string, label: string, anima: boolean][] = [
    ['days', String(c.days), copy.countdown.labels.days, true],
    ['hours', pad(c.hours), copy.countdown.labels.hours, true],
    ['minutes', pad(c.minutes), copy.countdown.labels.minutes, true],
    ['seconds', pad(c.seconds), copy.countdown.labels.seconds, false],
  ]

  return (
    <div className={`countdown${c.totalMs < URGENT_MS ? ' countdown--soon' : ''}`}>
      <p className="countdown__heading">{copy.countdown.heading}</p>

      {/* Un solo texto para el lector de pantalla, y sin aria-live: con el
          segundero, anunciarlo sería interrumpir a la persona una vez por
          segundo para siempre. Se lee cuando llega, como cualquier párrafo. */}
      <p className="sr-only">{spoken(c)}</p>

      <div className="countdown__boxes" aria-hidden="true">
        {boxes.map(([key, value, label, anima]) => (
          <div className="countdown__box" key={key}>
            {/* La key es el valor: al cambiar, React reemplaza el nodo y la
                animación de entrada arranca de nuevo. Sin eso el número salta
                de golpe. El segundero no lleva key: se le actualiza el texto y
                no se anima nada. */}
            <span className="countdown__n" key={anima ? value : undefined}>
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
  return `${copy.countdown.heading}: ${plural(c.days, 'day')}, ${plural(c.hours, 'hour')}, ${plural(c.minutes, 'minute')} and ${plural(c.seconds, 'second')}`
}
