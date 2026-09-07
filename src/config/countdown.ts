/**
 * La cuenta regresiva.
 *
 * Sí hay segundos, y son a propósito. La objeción es real —el segundero es el
 * recurso de las páginas de ofertas falsas— pero acá el plazo no es inventado:
 * el avión sale el día que sale, y la sensación que se busca es esa.
 *
 * Con prefers-reduced-motion no hay segundero: la cuenta se queda en días y
 * horas y se refresca una vez por minuto. Un número que cambia solo, sesenta
 * veces por minuto, en el medio de la pantalla, es exactamente lo que esa
 * preferencia pide que no pase.
 */

/** Menos de una semana: color de acento. */
export const URGENT_MS = 7 * 24 * 60 * 60 * 1000

/** Un tick por segundo. Uno solo en toda la página. */
export const TICK_MS = 1000

/** Con movimiento reducido alcanza con el minuto: no hay segundos que mover. */
export const TICK_REDUCED_MS = 60_000

/** Cuántas unidades se dicen. Con segundos, las cuatro; sin ellos, dos. */
export const MAX_UNITS = 4
export const MAX_UNITS_REDUCED = 2
