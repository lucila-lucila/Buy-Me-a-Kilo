import { copy } from '../copy'
import { useIntroCount } from '../lib/useIntroCount'
import { SuitcaseBar } from './SuitcaseBar'
import type { Journey } from '../lib/useKilos'

/**
 * La valija, ahora un medidor chico y un renglón de números.
 *
 * Kilo se fue a ser el personaje del juego, así que la valija dejó de tener a
 * quién acompañar: ya no es una ilustración protagonista, es el estado de la
 * cosa. Sigue llenándose y sigue saliendo de `percentFull`, que es el mismo
 * número que mueve la barra y que dice los kilos.
 *
 * La subida desde cero al cargar vive acá adentro a propósito. Es una animación
 * de sesenta cuadros por segundo durante casi un segundo, y si estuviera en App
 * haría re-renderizar la página entera —juego incluido— sesenta veces mientras
 * alguien está mirando la primera pantalla.
 */
export function Meter({ data, stale }: { data: Journey | null; stale: boolean }) {
  const percent = useIntroCount(data?.percentFull ?? null)
  const kilos = useIntroCount(data?.kilosTotal ?? null)

  // Mientras no llegó el primer fetch queda vacío, con la altura ya reservada
  // por CSS: no tiene sentido anunciar una valija que todavía no sabemos cómo
  // está.
  if (data === null) return <div className="meter" />

  // Solo puede pasar una vez: cuando la valija pase los 23 kilos. Se mira el
  // valor real y no el de la subida, que arranca en cero.
  const overweight = data.percentFull > 100

  return (
    <div className="meter" title={stale ? 'last known count' : undefined}>
      <SuitcaseBar percent={percent} overweight={overweight} />
      <p className="meter__line" aria-live="polite">
        {copy.suitcase.line(kilos, data.capacityKilos, data.gramsTotal, data.peopleTotal)}
      </p>
    </div>
  )
}
