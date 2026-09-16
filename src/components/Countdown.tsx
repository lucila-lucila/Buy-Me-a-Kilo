import { copy } from '../copy'
import { URGENT_MS } from '../config/countdown'
import { useCountdown } from '../lib/useCountdown'
import type { Countdown as CountdownState } from '../lib/useCountdown'
import type { Clock } from '../lib/useKilos'

/**
 * La cuenta regresiva, en tres cajitas.
 *
 *    41       03       27
 *   days    hours   minutes
 *
 * En cajitas y no en una frase corrida: la frase con los cuatro tramos medía
 * 1400 px y era lo que había roto el ancho de la página.
 *
 * Sin segundos: un segundero es lo único que se movería todo el tiempo y se
 * llevaría la atención que tienen que tener Kilo y el botón.
 *
 * Horas y minutos van con cero adelante. Acá no se lee como reloj de oferta
 * —es una grilla de números, no una frase— y de paso el ancho de cada cajita no
 * cambia nunca.
 *
 * Componente propio para que el tick no vuelva a renderizar Kilo, la valija ni
 * la barra cada minuto.
 */
export function Countdown({ clock }: { clock: Clock | null }) {
  const c = useCountdown(clock)

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

  return (
    <div className={`countdown${c.totalMs < URGENT_MS ? ' countdown--soon' : ''}`}>
      <p className="countdown__heading">{copy.countdown.heading}</p>

      {/* Un solo texto para el lector de pantalla. aria-live="polite" y no
          "assertive": que lo anuncie cuando termine lo que está leyendo, no que
          lo interrumpa cada vez que baja un minuto. */}
      <p className="sr-only" aria-live="polite">
        {spoken(c)}
      </p>

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
