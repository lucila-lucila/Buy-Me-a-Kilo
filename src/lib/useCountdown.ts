import { useEffect, useState } from 'react'
import { TICK_MS, TICK_REDUCED_MS } from '../config/countdown'
import type { Clock } from './useKilos'

const HOUR = 3_600_000
const DAY = 86_400_000

export interface Countdown {
  /** Lo que falta, en milisegundos. De acá sale todo lo demás. */
  totalMs: number
  /** Días enteros, hacia abajo: 44 días y 8 horas son 44 días, no 45. */
  days: number
  /** Horas dentro del día en curso, minutos dentro de la hora, y así. */
  hours: number
  minutes: number
  seconds: number
  departed: boolean
}

/**
 * La cuenta regresiva, descontando sola entre un fetch y el siguiente.
 *
 * Un solo temporizador en toda la página, y no le pide nada al servidor: el
 * fetch de /api/kilos sigue siendo uno cada treinta segundos y lo único que
 * trae es el ancla. Entre ancla y ancla esto resta tiempo transcurrido local.
 *
 * Se descuenta contra tiempo transcurrido y no contra la hora del reloj: el
 * reloj del visitante puede estar corrido, los milisegundos que pasan desde que
 * llegó la respuesta no.
 *
 * Vive en su propio componente justamente por el tick de un segundo: si el
 * estado estuviera en App, la valija, la barra y el carrusel se volverían a
 * renderizar sesenta veces por minuto para mover un dígito.
 */
export function useCountdown(clock: Clock | null, live = true): Countdown | null {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (clock === null) return
    // Un setInterval, no un setTimeout encadenado ni un requestAnimationFrame:
    // el segundero no necesita precisión de cuadro y rAF no corre con la
    // pestaña en segundo plano.
    const id = window.setInterval(() => setNow(Date.now()), live ? TICK_MS : TICK_REDUCED_MS)
    setNow(Date.now())
    return () => window.clearInterval(id)
  }, [clock, live])

  if (clock === null) return null

  const totalMs = Math.max(0, clock.msRemaining - (now - clock.at))

  return {
    totalMs,
    days: Math.floor(totalMs / DAY),
    hours: Math.floor((totalMs % DAY) / HOUR),
    minutes: Math.floor((totalMs % HOUR) / 60_000),
    seconds: Math.floor((totalMs % 60_000) / 1000),
    departed: totalMs <= 0,
  }
}
