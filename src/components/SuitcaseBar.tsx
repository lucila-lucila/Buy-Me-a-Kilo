import { copy } from '../copy'

/**
 * El llenado de la valija en curso.
 *
 * Sin etiquetas numéricas: el número grande de arriba mide exactamente lo mismo
 * y repetirlo era ruido. Queda el aria-label, que no se ve pero es lo único que
 * tiene un lector de pantalla.
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
    </div>
  )
}
