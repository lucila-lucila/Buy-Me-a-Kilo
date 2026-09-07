import { copy } from '../copy'
import { KOFI_URL } from '../config/kofi'

/**
 * Un solo botón a Ko-fi, donde la persona elige cuánto poner. Reemplaza a los
 * cuatro tiers: la escalera puede volver, pero no vale frenar el lanzamiento
 * esperándola.
 */
export function SupportButton() {
  return (
    <div className="support">
      <a className="support__button" href={KOFI_URL} target="_blank" rel="noopener noreferrer">
        {copy.support.cta}
      </a>
      <p className="support__note">{copy.support.note}</p>
    </div>
  )
}
