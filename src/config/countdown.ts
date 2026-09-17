/**
 * La cuenta regresiva.
 *
 * Cuatro cajitas —días, horas, minutos y segundos— y no una frase corrida. La
 * frase con los cuatro tramos medía 1400 px y era lo que rompía el ancho de la
 * página; en cajitas, los números entran en cualquier columna.
 *
 * El segundero vuelve. Es la sensación que tiene que dar la página: no es un
 * dato, es que el avión sale y el tiempo se está yendo.
 */

/** Menos de una semana: color de acento. */
export const URGENT_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Un tick por segundo, que es la unidad más chica que se muestra.
 *
 * Uno solo en toda la página y aislado adentro de su componente. Esto es lo que
 * hace que el segundero no le cueste un cuadro al juego, que ahora vive en la
 * misma pantalla: el tick re-renderiza la cuenta regresiva y nada más.
 */
export const TICK_MS = 1000
