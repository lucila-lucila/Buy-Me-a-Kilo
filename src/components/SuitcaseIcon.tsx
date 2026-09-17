/**
 * Una valijita que se llena, al lado de la barra.
 *
 * Es un ícono, no la ilustración de antes: sin glow, sin onda, sin respirar.
 * Lo que la barra dice en abstracto, esto lo dice de un vistazo. Lee el mismo
 * `percentFull` que la barra y sube con la misma transición, así las dos se
 * mueven juntas: si alguna vez el dibujo y el número no coinciden, es un bug.
 *
 * El relleno es un rectángulo recortado por la forma del cuerpo, que crece
 * desde abajo. Pasado el 100% se queda lleno.
 */
export function SuitcaseIcon({ percent }: { percent: number }) {
  const nivel = Math.min(100, Math.max(0, percent))
  // El cuerpo va de y=7 a y=21 (14 de alto). El relleno sube desde 21.
  const alto = (14 * nivel) / 100
  return (
    <svg className="suitcase-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="suitcase-icon-body">
          <rect x="3" y="7" width="18" height="14" rx="2.5" />
        </clipPath>
      </defs>
      {/* La manija. */}
      <rect x="8.5" y="3.5" width="7" height="4" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {/* Lo que hay adentro. */}
      <rect
        className="suitcase-icon__fill"
        x="3"
        y={21 - alto}
        width="18"
        height={alto}
        clipPath="url(#suitcase-icon-body)"
      />
      {/* El cuerpo, encima del relleno para que el borde quede limpio. */}
      <rect x="3" y="7" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
