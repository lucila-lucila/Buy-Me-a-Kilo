import { copy } from '../copy'

/**
 * El llenado de la valija en curso. Reemplaza a la barra semanal: la escala
 * ahora la da la valija, que se cierra a los 23 kilos y deja lugar a la
 * siguiente.
 */
export function SuitcaseBar({
  kilos,
  capacity,
  straining,
  note,
}: {
  kilos: number
  capacity: number
  straining: boolean
  /** La nota de la valija en curso: comparte fila con el progreso. */
  note: string
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
        <span>{straining ? copy.suitcase.straining : note}</span>
        <span>{copy.suitcase.progress(kilos, capacity)}</span>
      </div>
    </div>
  )
}
