
/**
 * El llenado de la valija.
 *
 * Sin etiquetas numéricas: los kilos están arriba y los gramos abajo, los tres
 * leyendo el mismo `percentFull`. Queda el aria-label, que no se ve pero es lo
 * único que tiene un lector de pantalla.
 */
export function SuitcaseBar({
  percent,
  overweight,
}: {
  percent: number
  /** Pasados los 23 kilos. Ahora solo puede pasar una vez. */
  overweight: boolean
}) {
  return (
    <div className={`goal${overweight ? ' goal--over' : ''}`}>
      <div
        className="goal__track"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent.toFixed(1)}% full`}
      >
        <div
          className="goal__fill"
          style={{ width: `${Math.min(100, Math.max(percent, percent > 0 ? 1.5 : 0))}%` }}
        />
      </div>
    </div>
  )
}
