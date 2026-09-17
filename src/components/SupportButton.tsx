import { copy } from '../copy'
import { KOFI_URL } from '../config/kofi'

/**
 * Un solo botón a Ko-fi, donde la persona elige cuánto poner.
 *
 * El color, la forma y el texto del botón no cambian nunca. Lo único que puede
 * cambiar es la línea de abajo: al terminar una partida pasa a decir que los
 * gramos que se compran sí cuentan.
 */
export function SupportButton({ note }: { note?: string }) {
  return (
    <div className="support">
      <a className="support__button" href={KOFI_URL} target="_blank" rel="noopener noreferrer">
        {copy.support.cta}
      </a>
      <p className="support__note">{note ?? copy.support.note}</p>
    </div>
  )
}
