import { Fragment } from 'react'
import { copy } from '../copy'
import { URGENT_MS } from '../config/countdown'
import { useCountdown } from '../lib/useCountdown'
import { useReducedMotion } from '../lib/reducedMotion'
import type { Clock } from '../lib/useKilos'

/**
 * La cuenta regresiva, con segundos.
 *
 * Componente propio a propósito: el tick es de un segundo, y si el estado
 * viviera en App se volverían a renderizar la valija, la barra, el carrusel y
 * el resto de la página sesenta veces por minuto para mover un dígito. Acá el
 * que se vuelve a dibujar es este párrafo y nada más.
 *
 * Cada número va en su propia casilla de ancho fijo (.countdown__n) y con
 * tabular-nums. Sin eso, "3 seconds" y "13 seconds" no ocupan lo mismo y la
 * frase entera se corre de lugar cada diez segundos.
 *
 * Los que leen con lector de pantalla reciben la versión gruesa, sin segundos:
 * un aria-live que se actualiza una vez por segundo es inusable.
 */
export function Countdown({ clock }: { clock: Clock | null }) {
  const reduced = useReducedMotion()
  const c = useCountdown(clock, !reduced)

  // Mientras no llegó el primer fetch queda vacía, pero con la altura ya
  // reservada por CSS: no tiene sentido anunciar un plazo que todavía no
  // sabemos, y menos aún hacer saltar la página cuando llega.
  if (c === null) return <p className="countdown" />

  if (c.departed) return <p className="countdown">{copy.countdown.gone}</p>

  const units = copy.countdown.units(c, reduced)
  const coarse = copy.countdown.units(c, true)
  const urgent = c.totalMs < URGENT_MS

  const spoken =
    coarse.length === 0
      ? copy.countdown.almost
      : coarse.map((u) => `${u.n} ${u.label}`).join(' and ')

  // Los separadores se calculan sobre la lista entera y después se parte en
  // renglones: "44 days, 8 hours, 12 minutes and 3 seconds", sin coma antes
  // del "and".
  const parts = units.map((u, i) => ({
    ...u,
    sep: i === units.length - 1 ? '' : i === units.length - 2 ? ' and ' : ', ',
  }))

  // El corte de renglón es nuestro y no del navegador. Si dejáramos que la
  // frase se acomodara sola, el salto de "3 seconds" a "13 seconds" movería
  // una palabra de un renglón al otro cada diez segundos. Los dos últimos
  // tramos van siempre juntos abajo.
  const rows = parts.length > 2 ? [parts.slice(0, -2), parts.slice(-2)] : [parts]

  return (
    <p className={`countdown${urgent ? ' countdown--soon' : ''}`}>
      <span className="countdown__lead">{copy.countdown.lead}</span>
      <span className="countdown__value" aria-hidden="true">
        {parts.length === 0 ? (
          <span className="countdown__row">{copy.countdown.almost}</span>
        ) : (
          rows.map((row) => (
            <span className="countdown__row" key={row[0].label}>
              {row.map((u) => (
                <Fragment key={u.label}>
                  {/* El espacio explícito: JSX se come el que hay entre un
                      elemento y una expresión en el renglón siguiente. */}
                  <span className="countdown__n">{u.n}</span>{' '}
                  {u.label}
                  {u.sep}
                </Fragment>
              ))}
            </span>
          ))
        )}
      </span>
      <span className="sr-only">{spoken}</span>
    </p>
  )
}
