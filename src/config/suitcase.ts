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
 * Gramos por dólar.
 *
 * Con montos libres no hay escalones que valgan: la conversión es proporcional.
 * Cinco dólares son tres gramos, que es lo que dice el copy, y el copy se deriva
 * de acá en vez de estar escrito a mano. Si cambia la constante, la frase se
 * corrige sola.
 *
 * No es un dato reservado: los precios ahora se muestran, así que vive del lado
 * del cliente y el webhook importa esta misma constante.
 */
export const GRAMS_PER_DOLLAR = 0.6

/** Mínimo un gramo: quien puso algo, puso algo. */
export const gramsForDollars = (dollars: number): number =>
  dollars <= 0 ? 0 : Math.max(1, Math.round(dollars * GRAMS_PER_DOLLAR))

/** Cada cuánto el front vuelve a pedir /api/kilos. */
export const KILOS_POLL_MS = 30_000
