/**
 * El número de kilos es el elemento tipográfico protagonista. Cuando sube, los
 * dígitos rotan verticalmente uno por uno.
 */
function Digit({ char }: { char: string }) {
  if (!/\d/.test(char)) return <span aria-hidden="true">{char}</span>
  const n = Number(char)
  return (
    <span className="digit" aria-hidden="true">
      <span className="digit__reel" style={{ transform: `translateY(-${n}em)` }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </span>
    </span>
  )
}

export function KiloCounter({
  total,
  unit,
  stale,
}: {
  total: number
  /** El número grande cuenta personas; los kilos viven en la barra. */
  unit: string
  stale: boolean
}) {
  // Un decimal fijo: 1.3, no 1.30 ni 1. El punto pasa por la rama de separador.
  const text = total.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (
    <p className="counter__number" title={stale ? 'last known count' : undefined}>
      <span className="sr-only">
        {text} {unit}
      </span>
      <span aria-hidden="true" style={{ display: 'flex' }}>
        {text.split('').map((char, i) => (
          <Digit key={`${i}-${char}`} char={char} />
        ))}
      </span>
      <span className="counter__unit" aria-hidden="true">
        {unit}
      </span>
    </p>
  )
}
