/**
 * El llenado de la valija.
 *
 * Sin etiquetas numéricas: los números van en el renglón de abajo, leyendo el
 * mismo `percentFull`. Queda el aria-label, que no se ve pero es lo único que
 * tiene un lector de pantalla.
 *
 * Pasado el 100% se queda llena y nada más: sin derrame ni color de alarma.
 * Que se pase se nota por el número, no por un efecto.
 */
export function SuitcaseBar({ percent }: { percent: number }) {
  return (
    <div className="goal">
      <div
        className="goal__track"
        role="progressbar"
        aria-valuenow={Math.min(100, Math.round(percent))}
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
