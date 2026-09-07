/**
 * La escala de la página.
 *
 * No hay meta semanal ni umbral para mostrar el contador: la escala la da la
 * valija en curso y la cuenta regresiva. Cuando una valija se llena, se cierra y
 * arranca la siguiente, así que la página siempre muestra una a medio llenar y
 * nunca se ve ni vacía ni desbordada.
 */

/** Franquicia de equipaje despachado. La capacidad de una valija. */
export const SUITCASE_CAPACITY_KG = 23

/** Cada cuánto el front vuelve a pedir /api/kilos. */
export const KILOS_POLL_MS = 30_000

/**
 * A cuántos kilos del cierre la valija empieza a forzar.
 *
 * Es el disparador que hereda la coreografía de derrame: una valija a punto de
 * cerrarse es el único momento en que está de verdad al límite. Se repite cada
 * 23 kilos, así que es un latido recurrente y no un estado que pasa una vez.
 */
export const STRAINING_FROM_KG = SUITCASE_CAPACITY_KG - 2
