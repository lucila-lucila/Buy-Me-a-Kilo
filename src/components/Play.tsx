import { useCallback, useState } from 'react'
import { copy } from '../copy'
import { remember } from '../lib/records'
import { Layover } from './games/layover/Layover'
import { SupportButton } from './SupportButton'

/** El único juego. El récord se guarda con esta clave. */
const JUEGO = 'layover'

/**
 * El juego y el botón, que son lo mismo: un bloque.
 *
 * El juego es el elemento más grande de la pantalla y está listo para jugar sin
 * ninguna pantalla que haya que pasar antes. El botón va inmediatamente abajo,
 * siempre visible y sin scroll, porque es lo primero que se ve al terminar de
 * jugar. Por eso los dos viven en el mismo componente: lo que cambia al
 * terminar una partida —el resultado arriba y la línea de abajo del botón— es
 * un solo estado y no dos que haya que mantener sincronizados.
 *
 * Los gramos de la partida no tocan el contador de la página. Solo el webhook
 * de un aporte real mueve ese número, y esa es la regla que sostiene la página
 * entera: si jugar llenara la valija, el contador dejaría de ser verdadero.
 *
 * `terminar` va con useCallback y no es negociable. Layover recibe ese callback
 * como dependencia de su efecto: si cambiara de identidad en cada render, el
 * efecto se volvería a montar y la partida se reiniciaría sola. Y esto vive en
 * la pantalla principal, al lado de una cuenta regresiva que hace tick cada
 * segundo.
 */
export function Play() {
  // La partida se reinicia remontando el juego, no reseteando su estado desde
  // afuera: todo lo que el juego sabe vive adentro de su efecto.
  const [ronda, setRonda] = useState(0)
  const [resultado, setResultado] = useState<{ grams: number; best: number } | null>(null)

  const terminar = useCallback((grams: number) => {
    // El récord es lo único que se guarda, y vive en el localStorage de cada
    // persona. Sin cuenta, sin servidor y sin tabla: el único número contra el
    // que se juega es el propio.
    setResultado({ grams, best: remember(JUEGO, grams) })
  }, [])

  const otraVez = useCallback(() => {
    setResultado(null)
    setRonda((n) => n + 1)
  }, [])

  return (
    <div className="play">
      <div className="play__stage">
        <Layover key={ronda} onEnd={terminar} />

        {/* El resultado se dibuja encima del último cuadro, que queda
            congelado: una partida que termina en una pantalla vacía se lee
            como un error. */}
        {resultado !== null && (
          <div className="play__result">
            <p className="play__score">
              {copy.game.result.packed(resultado.grams)}
              <br />
              <span className="play__fake">{copy.game.result.fake}</span>
            </p>
            {resultado.best > 0 && (
              <p className="play__best">{copy.game.result.best(resultado.best)}</p>
            )}
            <button className="play__again" type="button" onClick={otraVez}>
              {copy.game.result.again}
            </button>
          </div>
        )}
      </div>

      <p className="play__help">{copy.game.help}</p>

      {/* Lo único que cambia del botón al terminar una partida es la línea de
          abajo: los gramos que acaba de juntar no eran reales y los que se
          compran sí. El botón —color, forma y texto— no se toca. */}
      <SupportButton note={resultado !== null ? copy.game.result.note : undefined} />
    </div>
  )
}
