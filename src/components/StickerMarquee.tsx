import { STICKERS, webpSrc } from '../config/stickers'
import { copy } from '../copy'

/**
 * La colección desfilando, no un catálogo de casillas vacías.
 *
 * Doce fichas apagadas se leen como once rotos. Acá se ven los doce enteros y a
 * color, pasando en loop: lo que no se sabe es cuál te toca, no si existen.
 *
 * El loop no tiene costura porque la lista va duplicada en el DOM y se desplaza
 * exactamente el ancho de una copia; al llegar, la animación reinicia y el
 * cuadro es idéntico al inicial. La copia va con aria-hidden para que un lector
 * de pantalla no lea veinticuatro stickers.
 */
export function StickerMarquee() {
  return (
    <section className="section" aria-labelledby="marquee-heading">
      <h2 className="section__heading" id="marquee-heading">
        {copy.grid.heading}
      </h2>

      {/* La región es focusable a propósito: con reduced-motion se convierte en
          un contenedor con scroll horizontal, y un scroll sin acceso por teclado
          es una trampa. De paso, el foco pausa la cinta. */}
      <div className="marquee" tabIndex={0} role="group" aria-label={copy.grid.heading}>
        <div className="marquee__track">
          <Row />
          <Row duplicate />
        </div>
      </div>
    </section>
  )
}

function Row({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul className="marquee__row" aria-hidden={duplicate || undefined}>
      {STICKERS.map((s) => (
        <li className="marquee__item" key={s.id}>
          <img
            className="blend-screen"
            src={webpSrc(s.id)}
            alt={duplicate ? '' : s.alt}
            width={1024}
            height={1024}
            decoding="async"
            // Sin lazy: la cinta se mueve con transform, no con scroll, así que
            // las fichas de la derecha nunca entran en viewport y el navegador
            // no las pide nunca; el desfile se llena de huecos. Van eager pero
            // con prioridad baja, para no competir con el hero. Son doce URLs:
            // la copia duplicada sale de cache.
            {...({ fetchpriority: 'low' } as Record<string, string>)}
          />
        </li>
      ))}
    </ul>
  )
}
