import { copy } from '../copy'
import { URGENT_MS } from '../config/countdown'
import { useCountdown } from '../lib/useCountdown'
import type { Clock } from '../lib/useKilos'

/**
 * La cuenta regresiva. Días, y nada más.
 *
 *   my flight to japan leaves in 44 days
 *
 * Tuvo segundos y funcionaban, pero eran lo único que se movía en toda la
 * página y se llevaban toda la atención puesta en la valija y en el botón. Un
 * plazo que baja de a un día por día dice lo mismo sin pedir que lo mires.
 *
 * Abajo del día la unidad baja sola —horas, después minutos— porque decir
 * "0 days" el último día sería peor que no decir nada.
 *
 * Componente propio igual: el tick es de un minuto, y si el estado viviera en
 * App se volverían a renderizar la valija, la barra y el carrusel cada vez.
 */
export function Countdown({ clock }: { clock: Clock | null }) {
  const c = useCountdown(clock)

  // Mientras no llegó el primer fetch queda vacía, con la altura ya reservada
  // por CSS: no tiene sentido anunciar un plazo que todavía no sabemos.
  if (c === null) return <p className="countdown" />
  if (c.departed) return <p className="countdown">{copy.countdown.gone}</p>

  const [unit] = copy.countdown.units(c)
  const urgent = c.totalMs < URGENT_MS

  return (
    <p className={`countdown${urgent ? ' countdown--soon' : ''}`}>
      {/* Sin espacio en el medio: el hueco lo pone el column-gap del flex. Con
          los dos, la frase quedaba con un espacio y medio. */}
      <span className="countdown__lead">{copy.countdown.lead}</span>
      <span className="countdown__value">
        {unit === undefined ? copy.countdown.almost : `${unit.n} ${unit.label}`}
      </span>
    </p>
  )
}
