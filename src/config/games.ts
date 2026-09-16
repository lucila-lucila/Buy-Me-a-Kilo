/**
 * El catálogo de juegos.
 *
 * Los juegos no viven en la landing: viven detrás de un link, en una capa por
 * encima. La página sigue siendo una sola pantalla y los juegos son opcionales,
 * escondidos a un clic.
 *
 * Ninguno toca el contador de gramos. Jugar no llena la valija: solo el webhook
 * de un aporte real mueve el contador. Si un juego sumara gramos, el contador
 * dejaría de ser verdadero, y esa es la regla que sostiene toda la página.
 */
export interface Game {
  id: 'pack' | 'layover'
  name: string
  /** Una línea de qué es. Nada más. */
  line: string
  /** Se enciende cuando el juego existe de verdad. */
  ready: boolean
}

export const GAMES: Game[] = [
  {
    id: 'pack',
    name: 'Pack',
    line: 'stack what falls into the suitcase before the pile tips over.',
    ready: false,
  },
  {
    id: 'layover',
    name: 'Layover',
    line: 'fly from korea to japan. one button. dodge the excess baggage.',
    ready: false,
  },
]
