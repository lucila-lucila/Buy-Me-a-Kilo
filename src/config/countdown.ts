/**
 * La cuenta regresiva.
 *
 * Tres cajitas —días, horas y minutos— y no una frase corrida. La frase con los
 * cuatro tramos medía 1400 px y era lo que rompía el ancho de la página; en
 * cajitas, los números entran en cualquier columna.
 *
 * Sin segundos. Un segundero es lo único que se mueve todo el tiempo en una
 * pantalla, se lleva la atención que tienen que tener Kilo y el botón, y de
 * paso se parece a un temporizador de oferta.
 */

/** Menos de una semana: color de acento. */
export const URGENT_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Un tick por minuto, que es la unidad más chica que se muestra. Uno solo en
 * toda la página y aislado en su componente.
 */
export const TICK_MS = 60_000
