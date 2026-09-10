/**
 * La cuenta regresiva.
 *
 * Cuatro cajitas —días, horas, minutos y segundos— y no una frase corrida. La
 * frase con los cuatro tramos medía 1400 px y era lo que rompía el ancho de la
 * página; en cajitas, los mismos cuatro números entran en cualquier columna.
 */

/** Menos de una semana: color de acento. */
export const URGENT_MS = 7 * 24 * 60 * 60 * 1000

/** Un tick por segundo. Uno solo en toda la página. */
export const TICK_MS = 1000

/**
 * Con movimiento reducido no hay segundero: la cuenta se queda en días, horas y
 * minutos, y se refresca una vez por minuto. Un número que cambia solo, sesenta
 * veces por minuto, es exactamente lo que esa preferencia pide que no pase.
 */
export const TICK_REDUCED_MS = 60_000
