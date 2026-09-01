import { TIERS, kofiUrl, type Tier } from '../config/tiers'
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
  return (
    <a
      className={`tier ${AREA[tier.id]}`}
      href={kofiUrl(tier)}
      target="_blank"
      rel="noopener noreferrer"
      data-tier={tier.id}
    >
      <span className="tier__label">{tier.label}</span>
      <span className="tier__note">{tier.note}</span>
      <span className="tier__kilos" aria-hidden="true">
        {tier.kilos} kg
      </span>
    </a>
  )
}

export function TierGrid() {
  return (
    <div className="tiers">
      {TIERS.map((tier) => (
        <TierButton key={tier.id} tier={tier} />
      ))}
      <p className="tiers__note">{copy.tiers.priceNote}</p>
    </div>
  )
}
