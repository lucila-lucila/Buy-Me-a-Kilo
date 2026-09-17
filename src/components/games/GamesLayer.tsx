import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { copy } from '../../copy'
import { GAMES, type Game } from '../../config/games'
import { KOFI_URL } from '../../config/kofi'
import { remember } from '../../lib/records'

/** Cada juego en su propio chunk: abrir el selector no baja ningún juego. */
const Pack = lazy(() => import('./pack/Pack'))
const Layover = lazy(() => import('./layover/Layover'))

type Vista =
  | { modo: 'menu' }
  | { modo: 'juego'; id: Game['id'] }
  | { modo: 'resultado'; id: Game['id']; grams: number; best: number }

/** Todo lo que puede recibir foco adentro de la capa. */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * La capa de juegos.
 *
 * Una capa por encima de la página, no una ruta nueva: la página de atrás queda
 * donde estaba, quieta y difuminada, y al cerrar se vuelve a ella sin recargar
 * nada.
 *
 * El botón de donar está siempre visible, también acá adentro, abajo a la
 * derecha. No tapa el juego y no aparece de golpe: es la regla que no se rompe.
 *
 * Accesibilidad: es un diálogo modal con el foco atrapado adentro, se cierra
 * con Esc y al cerrarse el foco vuelve al link que la abrió. Sin eso, quien
 * navega con teclado sale de la capa sin darse cuenta y queda tabulando por una
 * página que no puede ver.
 *
 * Va en un portal, colgando de <body> y no de donde está escrita. Dos razones,
 * las dos encontradas a los golpes: un modal no puede depender de que ningún
 * ancestro le cree un contexto de apilado, y la regla que congela la página de
 * atrás —`.games-open .page *`— alcanzaba también a la capa, que estaba adentro
 * de .page, y le dejaba su propia animación de entrada pausada en opacity 0.
 *
 * Este archivo se carga en diferido, recién cuando se abre la capa: nada del
 * código de los juegos pesa en la carga inicial de la landing.
 */
export default function GamesLayer({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState<Vista>({ modo: 'menu' })

  const terminar = useCallback(
    (id: Game['id']) => (grams: number) => {
      // El récord es lo único que se guarda, y vive en el localStorage de cada
      // persona. Los gramos del juego no tocan el contador de la página: eso
      // solo lo mueve un aporte real.
      setVista({ modo: 'resultado', id, grams, best: remember(id, grams) })
    },
    [],
  )

  // El foco vuelve a entrar en la capa cada vez que cambia de vista: si no,
  // quien apretó "play again" se queda con el foco en un botón que ya no está.
  useEffect(() => {
    const layer = ref.current
    if (layer === null) return

    // Lo primero que recibe foco es la X: es la salida, y anunciar la salida
    // antes que el contenido es lo correcto en un modal.
    //
    // Menos cuando arranca un juego: ahí el foco es del canvas, que se lo toma
    // él mismo al montarse. Los efectos del hijo corren antes que los del
    // padre, así que sin esta guarda el foco se lo robaba la X y el juego
    // dejaba de andar con el teclado.
    if (vista.modo !== 'juego') layer.querySelector<HTMLElement>('.games__close')?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const items = [...layer.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      // El foco da la vuelta adentro de la capa en vez de irse a la página.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, vista.modo])

  return createPortal(
    <div
      className="games"
      role="dialog"
      aria-modal="true"
      aria-label={copy.games.label}
      ref={ref}
    >
      <button className="games__close" type="button" onClick={onClose} aria-label={copy.games.close}>
        <span aria-hidden="true">×</span>
      </button>

      <div className="games__body">
        {vista.modo === 'menu' && (
          <>
            <ul className="games__cards">
              {GAMES.map((g) => (
                <li key={g.id}>
                  <button
                    className="games__card"
                    type="button"
                    disabled={!g.ready}
                    onClick={() => setVista({ modo: 'juego', id: g.id })}
                    aria-describedby={g.ready ? undefined : `soon-${g.id}`}
                  >
                    <span className="games__name">{g.name}</span>
                    <span className="games__line">{g.line}</span>
                    {!g.ready && (
                      <span className="games__soon" id={`soon-${g.id}`}>
                        {copy.games.notYet}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {/* La única línea de la promesa del sticker que sobrevive fuera de
                /open: es lo que se recibe a cambio de pagar. */}
            <p className="games__promise">{copy.games.promise}</p>
          </>
        )}

        {vista.modo === 'juego' && (
          <Suspense fallback={null}>
            {vista.id === 'pack' ? (
              <Pack onEnd={terminar(vista.id)} />
            ) : (
              <Layover onEnd={terminar(vista.id)} />
            )}
          </Suspense>
        )}

        {vista.modo === 'resultado' && (
          <div className="games__result">
            <p className="games__resultScore">
              {copy.games.result.packed(vista.grams)}
              <br />
              <span className="games__resultFake">{copy.games.result.fake}</span>
            </p>
            {vista.best > 0 && <p className="games__best">{copy.games.result.best(vista.best)}</p>}

            <a className="games__cta" href={KOFI_URL} target="_blank" rel="noopener noreferrer">
              {copy.support.cta}
            </a>
            <p className="games__note">{copy.games.result.note}</p>

            <button
              className="games__again"
              type="button"
              onClick={() => setVista({ modo: 'juego', id: vista.id })}
            >
              {copy.games.result.again}
            </button>
          </div>
        )}
      </div>

      {/* El de la esquina está siempre, menos en el resultado, que ya tiene el
          suyo grande: dos botones iguales en la misma pantalla se anulan. */}
      {vista.modo !== 'resultado' && (
        <a
          className="games__support"
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.support.cta}
        </a>
      )}
    </div>,
    document.body,
  )
}
