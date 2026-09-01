/**
 * Variables de presentación, no de negocio. La barra se calibra para que se
 * llene seguido; el progreso que muestra son siempre kilos reales.
 */

/** La barra que se llena. Se resetea los lunes 00:00 UTC. */
export const WEEKLY_GOAL_KG = 10

/**
 * Debajo de esto no se muestra el número grande, solo la barra. Un "4 kg" le
 * dice al visitante que la página está muerta. El número que se muestra es
 * siempre real: simplemente no se muestra hasta que dice algo.
 */
export const COUNTER_THRESHOLD_KG = 50

/** Cada cuánto el front vuelve a pedir /api/kilos. */
export const KILOS_POLL_MS = 30_000
