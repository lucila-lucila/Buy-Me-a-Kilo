import { useEffect, useState } from 'react'
import { TICK_MS } from '../config/countdown'
import type { Clock } from './useKilos'

const HOUR = 3_600_000
const DAY = 86_400_000

export interface Countdown {
  /** Lo que falta, en milisegundos. De acá sale todo lo demás. */
  totalMs: number
  /** Días enteros, hacia abajo: 44 días y 8 horas son 44 días, no 45. */
  days: number
  /** Horas dentro del día en curso y minutos dentro de la hora. Se usan solos,
      el último día, cuando ya no quedan días que decir. */
  hours: number
  minutes: number
  departed: boolean
}

/**
 * La cuenta regresiva, descontando sola entre un fetch y el siguiente.
 *
 * Un solo temporizador en toda la página, de un minuto, y no le pide nada al
 * servidor: el fetch de /api/kilos sigue siendo uno cada treinta segundos y lo
 * único que trae es el ancla. Entre ancla y ancla esto resta tiempo local.
 *
 * Se descuenta contra tiempo transcurrido y no contra la hora del reloj: el
 * reloj del visitante puede estar corrido, los milisegundos que pasan desde que
 * llegó la respuesta no.
 *
 * Vive en su propio componente para que el tick no vuelva a renderizar la
 * valija, la barra y el carrusel cada vez.
 */
export function useCountdown(clock: Clock | null): Countdown | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (clock === null) return
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    setNow(Date.now())
    return () => window.clearInterval(id)
  }, [clock])

  if (clock === null) return null

  const totalMs = Math.max(0, clock.msRemaining - (now - clock.at))

  return {
    totalMs,
    days: Math.floor(totalMs / DAY),
    hours: Math.floor((totalMs % DAY) / HOUR),
    minutes: Math.floor((totalMs % HOUR) / 60_000),
    departed: totalMs <= 0,
  }
}
