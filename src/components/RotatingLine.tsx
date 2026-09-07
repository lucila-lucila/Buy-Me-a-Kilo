import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../lib/reducedMotion'

const INTERVAL_MS = 6000
const FADE_MS = 400

/**
 * Un renglón que alterna frases. Sin desplazamiento, sin flechas, sin carrusel.
 *
 * Nunca hay dos visibles a la vez: se apaga, cambia el texto y se enciende. Un
 * crossfade dejaría las dos superpuestas durante la transición.
 *
 * La altura la reserva el contenedor, calculada sobre la línea más larga, para
 * que el layout no salte al cambiar de frase.
 */
export function RotatingLine({ lines, frozen = false }: { lines: string[]; frozen?: boolean }) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const swap = useRef<number | undefined>(undefined)

  const still = reduced || frozen || lines.length < 2

  useEffect(() => {
    setIndex(0)
    setVisible(true)
  }, [lines.length, frozen])

  useEffect(() => {
    if (still) return
    const tick = window.setInterval(() => {
      setVisible(false)
      swap.current = window.setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length)
        setVisible(true)
      }, FADE_MS)
    }, INTERVAL_MS)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(swap.current)
    }
  }, [still, lines.length])

  return (
    <p className="rotating" aria-live="off">
      <span className={`rotating__line${visible ? '' : ' rotating__line--out'}`}>
        {lines[still ? 0 : index]}
      </span>
    </p>
  )
}
