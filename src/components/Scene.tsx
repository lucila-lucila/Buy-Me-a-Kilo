import { Suitcase } from './Suitcase'
import { copy } from '../copy'

/** El archivo de Kilo. Va aparte de los doce stickers: no es uno de ellos. */
const KILO_SRC = '/hero/kilo.webp'

/**
 * Kilo adelante, la valija atrás.
 *
 * Kilo es el protagonista de la página y la valija pasa a segundo plano: más
 * chica, más apagada y con menos brillo, pero sigue siendo el medidor y sigue
 * llenándose con los gramos reales.
 *
 * Los dos van con mix-blend-mode: screen —son ilustraciones sobre negro, y el
 * negro se vuelve transparente al mezclar—, así que esta caja no puede crear un
 * contexto de apilado: ni opacity, ni filter, ni transform acá adentro. El
 * fondo opaco que el blend necesita lo pone la página. Por eso la flotación de
 * Kilo va sobre la imagen misma y no sobre un contenedor.
 */
export function Scene({ ratio, overweight }: { ratio: number; overweight: boolean }) {
  return (
    <div className="scene">
      <Suitcase
        ratio={ratio}
        overweight={overweight}
        className="scene__suitcase"
        alt={copy.alt.suitcase}
      />
      <img
        className="scene__kilo blend-screen"
        src={KILO_SRC}
        alt={copy.alt.kilo}
        width={1024}
        height={1024}
        decoding="async"
        {...({ fetchpriority: 'high' } as Record<string, string>)}
      />
    </div>
  )
}
