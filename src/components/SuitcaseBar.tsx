import { copy } from '../copy'

/**
 * El llenado de la valija en curso. A la izquierda no va nada: todo lo que
 * estaba ahí se mudó a la línea rotativa, para que el hero deje de ser un muro
 * de texto.
 */
export function SuitcaseBar({
  kilos,
  capacity,
  straining,
}: {
  kilos: number
  capacity: number
  /** A uno o dos kilos del cierre: la barra empuja como la valija. */
  straining: boolean
}) {
  const pct = Math.min(100, (kilos / capacity) * 100)

  return (
    <div className={`goal${straining ? ' goal--over' : ''}`}>
      <div
        className="goal__track"
        role="progressbar"
        aria-valuenow={kilos}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={copy.suitcase.progress(kilos, capacity)}
      >
        <div className="goal__fill" style={{ width: `${Math.max(pct, kilos > 0 ? 3 : 0)}%` }} />
      </div>
      <div className="goal__meta">
        <span>{copy.suitcase.progress(kilos, capacity)}</span>
      </div>
    </div>
  )
}
