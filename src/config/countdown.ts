/**
 * La cuenta regresiva.
 *
 * Solo días. Tuvo segundos y andaban, pero eran lo único que se movía en la
 * página y se llevaban la atención que tienen que tener la valija y el botón.
 * Un plazo que baja de a un día por día mete la misma presión sin pedir que lo
 * mires, y de paso no se parece a un temporizador de oferta.
 */

/** Menos de una semana: color de acento. */
export const URGENT_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Un tick por minuto. Con días en pantalla alcanzaría con mucho menos, pero el
 * minuto cubre el cambio de día sin que se note y no cuesta nada.
 */
export const TICK_MS = 60_000
