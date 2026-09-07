/**
 * La escala de la página.
 *
 * Una sola valija de 23 kilos, para este viaje. La unidad interna son gramos,
 * porque un aporte no llena un kilo: lo llena entre muchos. Un kilo lo compran
 * unas doscientas personas, y ese es el chiste, dicho en voz alta en la página.
 */

/** 23 kilos de franquicia, medidos en gramos. */
export const SUITCASE_CAPACITY_G = 23_000

/**
 * Gramos por unidad de tier.
 *
 * De dónde sale: la meta son 5.200 personas con la mezcla esperada 85/10/4/1,
 * que da 1,51 unidades por persona y 7.852 unidades en total. 23.000 gramos
 * sobre 7.852 unidades dan 2,93 g, redondeado a 3. Si esas 5.200 personas
 * aportan, la valija queda llena.
 */
export const GRAMS_PER_UNIT = 3

/**
 * Gramos que aporta un tier. Se derivan de sus kilos-unidad (1, 3, 6, 12) y no
 * se escriben por separado: una tabla duplicada se desincroniza el día que
 * cambie GRAMS_PER_UNIT.
 */
export const gramsForUnits = (units: number): number => units * GRAMS_PER_UNIT

/** Cada cuánto el front vuelve a pedir /api/kilos. */
export const KILOS_POLL_MS = 30_000
