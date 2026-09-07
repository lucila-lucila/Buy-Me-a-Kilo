/**
 * Los tramos de la cuenta regresiva. Están acá y no en el componente porque los
 * usan tres lugares: el texto que elige qué unidad decir, el hook que decide
 * cada cuánto tickear, y el color de acento.
 *
 * Nunca hay segundos. El número más chico que se muestra es el minuto.
 */

/** Menos de dos días: se dejan de decir los días y se dicen horas. */
export const HOURS_TIER_MS = 48 * 60 * 60 * 1000

/** Menos de tres horas: minutos, y ahí el cliente descuenta solo. */
export const MINUTES_TIER_MS = 3 * 60 * 60 * 1000

/** Menos de una semana: color de acento. */
export const URGENT_MS = 7 * 24 * 60 * 60 * 1000
