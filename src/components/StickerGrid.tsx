import { STICKERS, webpSrc } from '../config/stickers'
import { copy } from '../copy'

/**
 * Los doce, enteros y quietos.
 *
 * Era una cinta infinita, y una cinta corta stickers contra el canto por
 * definición: siempre había uno cortado y otro entrando. Acá están los doce
 * completos, en dos filas de seis, y el movimiento lo pone la flotación
 * individual de cada uno, desfasada, que no depende de que la fila se desplace.
 *
 * Siguen en silueta. Que existen doce y qué forma tiene cada uno se ve; de qué
 * color son, no. El color aparece recién en /open, cuando se abre el tuyo.
 */
export function StickerGrid() {
  return (
    <section className="section" aria-labelledby="grid-heading">
      <h2 className="section__heading" id="grid-heading">
        {copy.grid.heading}
      </h2>

      <ul className="grid">
        {STICKERS.map((s, i) => (
          <li
            className="grid__item"
            key={s.id}
            /* Cada uno con su propio desfase, para que la fila no lata junta. */
            style={{ ['--delay' as string]: `${((i * 1.37) % 6).toFixed(2)}s` }}
          >
            <img
              className="blend-screen"
              src={webpSrc(s.id)}
              alt={s.alt}
              width={1024}
              height={1024}
              decoding="async"
              // Sin lazy: son doce y entran todos en el mismo scroll. Con
              // prioridad baja para no competir con la valija.
              {...({ fetchpriority: 'low' } as Record<string, string>)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
