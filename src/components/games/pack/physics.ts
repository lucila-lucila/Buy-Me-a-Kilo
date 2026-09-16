/**
 * La física de Pack: círculos, gravedad y apilado blando.
 *
 * Escrita a mano y no con una librería. Los bichos son blobs redondos, así que
 * un círculo los aproxima bien, y con círculos el apilado se resuelve en cien
 * líneas: separar los que se solapan, intercambiar impulso en la normal y
 * repetir unas cuantas veces por cuadro. Meter un motor de física entero para
 * esto serían noventa kilobytes en el chunk del juego para hacer lo mismo peor.
 *
 * El apilado se sostiene por relajación: cada paso se resuelve varias veces,
 * corrigiendo posiciones de a poco. Una sola pasada deja las pilas temblando.
 */

export interface Body {
  x: number
  y: number
  vx: number
  vy: number
  /** Radio del círculo. Es también la mitad del lado del dibujo. */
  r: number
  grams: number
  sprite: string
  /** Si es uno de los suyos va a color; si no, en silueta. */
  own: boolean
  /** Cuántos cuadros lleva casi quieto. Sirve para saber cuándo se asentó. */
  still: number
}

/** La caja donde se apila: el interior de la valija. */
export interface Box {
  left: number
  right: number
  /** El borde de arriba. Por encima de esto no hay paredes: es aire. */
  rim: number
  floor: number
}

const GRAVITY = 1700
/** Rebote bajo: los bichos son blandos y tienen que quedarse donde caen. */
const RESTITUTION = 0.18
const FRICTION = 0.86
/** Velocidad por debajo de la cual un cuerpo cuenta como quieto. */
const STILL_SPEED = 26
const ITERATIONS = 6

/** Un paso de simulación. dt en segundos, chico y fijo. */
export function step(bodies: Body[], box: Box, dt: number): void {
  for (const b of bodies) {
    b.vy += GRAVITY * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
  }

  for (let i = 0; i < ITERATIONS; i++) {
    resolvePairs(bodies)
    resolveWalls(bodies, box)
  }

  for (const b of bodies) {
    const speed = Math.hypot(b.vx, b.vy)
    b.still = speed < STILL_SPEED ? b.still + 1 : 0
  }
}

function resolvePairs(bodies: Body[]): void {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]
      const b = bodies[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy)
      const min = a.r + b.r
      if (dist >= min || dist === 0) continue

      const nx = dx / dist
      const ny = dy / dist
      // Corrección posicional a medias y amortiguada: separarlos de golpe hace
      // explotar la pila, y no separarlos la hunde.
      const push = ((min - dist) / 2) * 0.8
      a.x -= nx * push
      a.y -= ny * push
      b.x += nx * push
      b.y += ny * push

      const rvx = b.vx - a.vx
      const rvy = b.vy - a.vy
      const along = rvx * nx + rvy * ny
      // Ya se están separando: no hace falta impulso.
      if (along > 0) continue
      const impulse = -(1 + RESTITUTION) * along * 0.5
      a.vx -= impulse * nx
      a.vy -= impulse * ny
      b.vx += impulse * nx
      b.vy += impulse * ny
    }
  }
}

function resolveWalls(bodies: Body[], box: Box): void {
  for (const b of bodies) {
    // Las paredes solo existen de la boca de la valija para abajo. Arriba es
    // aire: por eso se puede pasar de largo y perder.
    const dentro = b.y + b.r > box.rim

    if (dentro && b.x - b.r < box.left) {
      b.x = box.left + b.r
      b.vx = Math.abs(b.vx) * RESTITUTION
      b.vy *= FRICTION
    }
    if (dentro && b.x + b.r > box.right) {
      b.x = box.right - b.r
      b.vx = -Math.abs(b.vx) * RESTITUTION
      b.vy *= FRICTION
    }
    if (b.y + b.r > box.floor) {
      b.y = box.floor - b.r
      b.vy = -Math.abs(b.vy) * RESTITUTION
      b.vx *= FRICTION
    }
  }
}

/** La energía del montón. Con esto Kilo sabe cuándo la pila se está tambaleando. */
export function wobble(bodies: Body[]): number {
  let total = 0
  for (const b of bodies) total += Math.hypot(b.vx, b.vy)
  return bodies.length === 0 ? 0 : total / bodies.length
}

/**
 * Se perdió cuando algo se fue afuera o cuando la pila se asentó por encima del
 * borde. "Asentado" y no "tocó": un bicho que pasa el borde en el rebote y
 * vuelve a entrar no tendría que costar la partida.
 */
export function lost(bodies: Body[], box: Box, height: number): 'outside' | 'overflow' | null {
  for (const b of bodies) {
    if (b.y - b.r > height) return 'outside'
    if (b.still > 12) {
      const fuera = b.x < box.left - b.r || b.x > box.right + b.r
      if (fuera) return 'outside'
      if (b.y + b.r < box.rim) return 'overflow'
    }
  }
  return null
}
