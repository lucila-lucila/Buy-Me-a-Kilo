import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './reducedMotion'

/** Lo que tarda el número en llegar a su valor al cargar. Lo mismo que la barra. */
export const RISE_MS = 900

/** Desacelera al final: rápido al principio, apoyando suave. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * El número sube desde cero hasta su valor la primera vez que llega, y después
 * sigue el valor real sin animar nada.
 *
 * Solo la primera vez: cuando el contador se mueve porque alguien aportó, el
 * número tiene que ir de 1,3 a 1,4, no volver a empezar de cero.
 *
 * Con movimiento reducido no hay subida: el valor aparece y listo.
 */
export function useIntroCount(target: number | null): number {
  const [value, setValue] = useState(0)
  const arrancó = useRef(false)

  useEffect(() => {
    if (target === null) return

    if (arrancó.current || prefersReducedMotion()) {
      arrancó.current = true
      setValue(target)
      return
    }

    arrancó.current = true
    const desde = performance.now()
    let raf = 0
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - desde) / RISE_MS)
      setValue(target * easeOut(t))
      if (t < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [target])

  return value
}
