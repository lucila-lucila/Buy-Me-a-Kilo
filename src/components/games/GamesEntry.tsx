import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { copy } from '../../copy'
import { HAY_JUEGOS } from '../../config/games'

/**
 * El código de la capa —y con él, el de los dos juegos— se carga recién cuando
 * alguien la abre. Nada de esto pesa en la carga inicial de la landing, que es
 * lo único que la página tiene que pintar rápido.
 */
const GamesLayer = lazy(() => import('./GamesLayer'))

/**
 * El único acceso a los juegos: un link chico debajo del botón.
 *
 * Es un <button> y no un <a>: no lleva a ninguna parte, abre una capa sobre la
 * misma página. Un <a href="#"> le mentiría al lector de pantalla y al menú del
 * botón derecho.
 *
 * Al cerrar, el foco vuelve acá. Es la contraparte del foco atrapado adentro de
 * la capa: sin esto, quien navega con teclado cierra y aparece tabulando desde
 * el principio del documento.
 */
export function GamesEntry() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    trigger.current?.focus()
  }, [])

  // Con la capa abierta, la página de atrás no se scrollea y se queda quieta:
  // difuminada y todavía moviéndose se lee como un error, y encima sigue
  // gastando cuadros por algo que no se ve.
  useEffect(() => {
    if (!open) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('games-open')
    return () => {
      document.body.style.overflow = previo
      document.body.classList.remove('games-open')
    }
  }, [open])

  // Sin ningún juego terminado no hay link: una capa con dos tarjetas que dicen
  // "not here yet" deja al que hizo clic peor que antes de hacerlo. Va después
  // de los hooks —HAY_JUEGOS es una constante de módulo, así que el orden de
  // hooks no cambia nunca entre renders.
  if (!HAY_JUEGOS) return null

  return (
    <>
      <button
        className="games__open"
        type="button"
        ref={trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {copy.games.open}
      </button>

      {open && (
        // Sin fallback visible: el chunk pesa poco y un cartel de "cargando"
        // que parpadea medio segundo se ve peor que nada.
        <Suspense fallback={null}>
          <GamesLayer onClose={close} />
        </Suspense>
      )}
    </>
  )
}
