import { TIERS, kofiUrl, unconfiguredTiers, type Tier } from '../config/tiers'
import { copy } from '../copy'

/**
 * Los cuatro tiers, siempre visibles al mismo tiempo. Nunca detrás de un
 * desplegable: la gente sube de escalón cuando ve el escalón.
 *
 * El de tres kilos es el más grande y el primero del DOM, así que también es el
 * primero en el orden de tabulación. Sin badges de "most popular", sin
 * contadores de escasez, sin temporizadores.
 */
const AREA: Record<string, string> = {
  three: 'tier--three',
  one: 'tier--one',
  carry: 'tier--carry',
  overweight: 'tier--over',
}

function TierButton({ tier }: { tier: Tier }) {
  const href = kofiUrl(tier)
  const inside = (
    <>
      <span className="tier__label">{tier.label}</span>
      <span className="tier__note">{tier.note}</span>
      <span className="tier__kilos" aria-hidden="true">
        {tier.kilos} kg
      </span>
    </>
  )

  // Sin código de Ko-fi cargado no hay a dónde mandar a nadie. Antes que un link
  // que va a un lugar equivocado, no hay link.
  if (href === null) {
    return (
      <div className={`tier ${AREA[tier.id]} tier--off`} data-tier={tier.id} aria-disabled="true">
        {inside}
      </div>
    )
  }

  return (
    // Navega en la misma pestaña a propósito: se va a Ko-fi, se paga, y Ko-fi
    // devuelve a /open. En una pestaña nueva la persona termina el flujo en una
    // ventana y deja la landing vieja abierta atrás.
    <a className={`tier ${AREA[tier.id]}`} href={href} data-tier={tier.id}>
      {inside}
    </a>
  )
}

export function TierGrid() {
  return (
    <div className="tiers">
      {TIERS.map((tier) => (
        <TierButton key={tier.id} tier={tier} />
      ))}
      {/* La nota de precio se fue: el checkout lo muestra igual. Queda solo el
          aviso de tienda cerrada, que sí dice algo que no se ve de otro modo. */}
      {unconfiguredTiers().length > 0 && <p className="tiers__note">{copy.tiers.unconfigured}</p>}
    </div>
  )
}
