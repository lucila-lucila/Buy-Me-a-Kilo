import { useEffect, useState } from 'react'
import { MINUTES_TIER_MS } from '../config/countdown'
import type { Clock } from './useKilos'

const HOUR = 3_600_000
const DAY = 86_400_000

export interface Countdown {
  /** Lo que falta, en milisegundos. De acá sale todo lo demás. */
  totalMs: number
  /** Días enteros, hacia abajo: 45 días y 6 horas son 45 días, no 46. */
  days: number
  /** Horas dentro del día en curso. */
  hours: number
  /** Horas totales, para el tramo de menos de dos días. */
  totalHours: number
  minutes: number
  departed: boolean
}

/**
 * La cuenta regresiva, descontando sola entre un fetch y el siguiente.
 *
 * No hay segundos en ningún tramo. Los segundos son el recurso de las páginas
 * de ofertas falsas y esa asociación no la queremos ni gratis: el número más
 * chico que llega a mostrarse es el minuto.
 *
 * El ancla viene del servidor y se descuenta con tiempo transcurrido local, no
 * con la hora del reloj. El reloj del visitante puede estar corrido; los
 * milisegundos que pasan desde que llegó la respuesta, no.
 */
export function useCountdown(clock: Clock | null): Countdown | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (clock === null) return

    const left = clock.msRemaining - (Date.now() - clock.at)
    // Arriba de tres horas el minuto no se muestra y alcanza con el poll de 30s
    // que ya trae los kilos. Abajo, tickea acá para que el minuto baje aunque
    // el fetch falle.
    const step = left < MINUTES_TIER_MS ? 10_000 : 60_000

    const id = window.setInterval(() => setNow(Date.now()), step)
    setNow(Date.now())
    return () => window.clearInterval(id)
  }, [clock])

  if (clock === null) return null

  const totalMs = Math.max(0, clock.msRemaining - (now - clock.at))

  return {
    totalMs,
    days: Math.floor(totalMs / DAY),
    hours: Math.floor((totalMs % DAY) / HOUR),
    totalHours: Math.floor(totalMs / HOUR),
    minutes: Math.floor((totalMs % HOUR) / 60_000),
    departed: totalMs <= 0,
  }
}
