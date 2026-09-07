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
 * Sale de una sola pieza: la frase fija y los números son dos bloques que no se
 * cortan por dentro. Si entran los dos en el ancho, van en un renglón; si no,
 * el navegador los apila y quedan la frase entera arriba y todos los números
 * juntos abajo. Ningún corte pasa nunca entre un número y el siguiente.
 *
 * Los números van en cifras de ancho tabular: en Familjen Grotesk todas las
 * cifras miden lo mismo, así que el segundo que pasa de 38 a 37 no mueve nada.
 * Cuando un tramo cruza de dos cifras a una —una vez por minuto en los
 * segundos— la frase se recentra medio dígito, y eso es lo que hace cualquier
 * cuenta regresiva. Reservar el ancho de la cifra que falta lo evitaría, pero
 * deja un hueco permanente después de la coma que se lee como un error de
 * espaciado, y se ve mucho más que el recentrado.
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

  // "44 days, 8 hours, 12 minutes and 3 seconds": coma entre todos menos antes
  // del "and".
  const sep = (i: number) => (i === units.length - 1 ? '' : i === units.length - 2 ? ' and ' : ', ')

  return (
    <p className={`countdown${urgent ? ' countdown--soon' : ''}`}>
      <span className="countdown__lead">{copy.countdown.lead}</span>
      <span className="countdown__value" aria-hidden="true">
        {units.length === 0
          ? copy.countdown.almost
          : units.map((u, i) => (
              <Fragment key={u.label}>
                {u.n} {u.label}
                {sep(i)}
              </Fragment>
            ))}
      </span>
      <span className="sr-only">{spoken}</span>
    </p>
  )
}
