import { STICKERS, webpSrc } from '../config/stickers'
import { copy } from '../copy'
import type { Collection } from '../lib/collection'

/**
 * Los doce, apagados, antes de pagar. Nadie paga por algo que no vio: el
 * misterio es cuál te toca, no si existen.
 */
export function StickerGrid({ collection }: { collection: Collection }) {
  return (
    <section className="section" aria-labelledby="grid-heading">
      <h2 className="section__heading" id="grid-heading">
        {copy.grid.heading}
      </h2>
      <div className="grid">
        {STICKERS.map((s) => {
          const owned = (collection[s.id] ?? 0) > 0
          return (
            <div key={s.id} className={`grid__cell${owned ? ' grid__cell--owned' : ''}`}>
              <img
                className="blend-screen"
                src={webpSrc(s.id)}
                alt={owned ? s.alt : ''}
                width={1024}
                height={1024}
                loading="lazy"
                decoding="async"
              />
              {(collection[s.id] ?? 0) > 1 && <span className="grid__count">×{collection[s.id]}</span>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
