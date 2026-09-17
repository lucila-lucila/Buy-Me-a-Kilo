/**
 * El paisaje de Layover, dibujado con formas y no con imágenes.
 *
 * Los dos ecosistemas ilustrados todavía no existen como archivo, así que por
 * ahora las siluetas van hechas con paths en la paleta de la página. Cuando
 * lleguen los dibujos, cada `case` de acá se reemplaza por un drawImage y el
 * resto del juego no se entera.
 *
 * Tres capas con parallax: el fondo lento —lomas y montañas, un perfil bajo
 * sobre el horizonte—, el medio —las casas, los faroles, los portales— y las
 * siluetas cercanas que pasan rápido por abajo del borde.
 *
 * Corea primero, Japón después. Cada pieza sabe de qué país es, y no lo decide
 * el reloj de la partida sino dónde está: al cambiar de país, lo que ya está en
 * pantalla sigue siendo Corea hasta que sale por la izquierda, y todo lo que
 * entra por la derecha es Japón. Una cortina de un lado al otro, por capa.
 *
 * Cada forma tiene dos pasadas. La silueta, en el color de su capa, y la luz:
 * la ventana prendida del hanok, la caja del farol, la nieve del Fuji, la
 * espuma. Sin la luz eran bloques planos oscuros que no se leían como lugares.
 *
 * El verde menta no está en ninguna de las dos paletas y no puede estar: es el
 * color de lo que se junta. Y el rojo tampoco: es el de lo que se esquiva.
 *
 * Todo se dibuja como siluetas llenas y cerradas. Una línea suelta no pinta
 * nada: si una forma necesita un detalle fino, es un rectángulo flaco, no un
 * `lineTo`. Y todo arco va precedido de un `moveTo` a su propio punto de
 * arranque, porque si no el `fill` lo une con la figura anterior y aparece una
 * astilla de color donde no va nada.
 */
export type Pais = 'korea' | 'japan'
/** 0 es el fondo, 2 el frente. */
export type Capa = 0 | 1 | 2

export interface Pieza {
  capa: Capa
  pais: Pais
  tipo: string
  x: number
  /** Variación de tamaño, alrededor de 1. Dos hanoks nunca miden igual. */
  escala: number
}

/** Cuánto de la velocidad del mundo lleva cada capa. */
export const PARALAJE: Record<Capa, number> = { 0: 0.22, 1: 0.5, 2: 0.95 }

/** Alto de cada capa, en fracción del alto del canvas. */
export const ALTO_CAPA: Record<Capa, number> = { 0: 0.11, 1: 0.16, 2: 0.2 }

/** Cuántas piezas por capa, repartidas a lo largo del ciclo. */
export const CANTIDAD: Record<Capa, number> = { 0: 7, 1: 6, 2: 4 }

export interface Paleta {
  /** El color de la silueta de cada capa. */
  capa: Record<Capa, string>
  /** La luz propia de las formas. */
  luz: string
  /** El resplandor del horizonte, como rgb sin alfa: el alfa lo pone el juego. */
  horizonte: [number, number, number]
}

export const PALETA: Record<Pais, Paleta> = {
  korea: {
    capa: { 0: 'rgba(255, 79, 163, 0.16)', 1: 'rgba(255, 162, 76, 0.5)', 2: 'rgba(255, 79, 163, 0.5)' },
    luz: 'rgba(255, 224, 170, 0.9)',
    horizonte: [255, 162, 76],
  },
  japan: {
    capa: { 0: 'rgba(59, 123, 255, 0.18)', 1: 'rgba(59, 123, 255, 0.52)', 2: 'rgba(132, 112, 255, 0.52)' },
    luz: 'rgba(222, 232, 255, 0.9)',
    horizonte: [59, 123, 255],
  },
}

const FORMAS: Record<Pais, Record<Capa, string[]>> = {
  korea: {
    0: ['lomas', 'lomas', 'loma'],
    1: ['hanok', 'vasija', 'caqui', 'hanok', 'urraca'],
    2: ['hanok', 'urraca', 'vasija', 'caqui'],
  },
  japan: {
    0: ['montaña', 'lomas', 'lomas'],
    1: ['portal', 'farol', 'portal', 'farol', 'pagoda'],
    2: ['onda', 'portal', 'onda', 'farol'],
  },
}

export const formaDe = (pais: Pais, capa: Capa, i: number): string => {
  const f = FORMAS[pais][capa]
  return f[((i % f.length) + f.length) % f.length]
}

const TAU = Math.PI * 2

/** Un círculo que no se pega al subpath anterior. */
function circulo(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.moveTo(cx + r, cy)
  ctx.arc(cx, cy, r, 0, TAU)
}

/** Lo mismo para una elipse, girada o no. */
function elipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  giro = 0,
): void {
  ctx.moveTo(cx + rx * Math.cos(giro), cy + rx * Math.sin(giro))
  ctx.ellipse(cx, cy, rx, ry, giro, 0, TAU)
}

/**
 * La silueta de cada forma, apoyada en (x, base) y de `s` píxeles de alto.
 *
 * `s` es el alto: el ancho de cada forma sale de sus propias proporciones y
 * puede pasarse bastante para los dos lados —las lomas, sobre todo—.
 */
export function silueta(ctx: CanvasRenderingContext2D, tipo: string, x: number, base: number, s: number): void {
  ctx.beginPath()
  switch (tipo) {
    // Lomas: dos jorobas anchas y bajas, el perfil del fondo.
    case 'lomas':
      ctx.moveTo(x - s * 3.4, base)
      ctx.quadraticCurveTo(x - s * 2.2, base - s * 1.0, x - s * 1.0, base - s * 0.55)
      ctx.quadraticCurveTo(x - s * 0.2, base - s * 0.25, x + s * 0.5, base - s * 0.7)
      ctx.quadraticCurveTo(x + s * 1.6, base - s * 1.3, x + s * 3.4, base)
      ctx.closePath()
      break

    // Una loma sola, más alta.
    case 'loma':
      ctx.moveTo(x - s * 2.2, base)
      ctx.quadraticCurveTo(x - s * 0.6, base - s * 1.5, x + s * 0.4, base - s * 1.1)
      ctx.quadraticCurveTo(x + s * 1.4, base - s * 0.7, x + s * 2.2, base)
      ctx.closePath()
      break

    // Techo de hanok: el alero que se hunde en el medio y se levanta en las
    // puntas, sobre el cuerpo de la casa.
    case 'hanok':
      ctx.moveTo(x - s * 1.0, base - s * 0.58)
      ctx.quadraticCurveTo(x - s * 0.44, base - s * 0.58, x, base - s * 0.9)
      ctx.quadraticCurveTo(x + s * 0.44, base - s * 0.58, x + s * 1.0, base - s * 0.58)
      ctx.lineTo(x + s * 0.74, base - s * 0.44)
      ctx.quadraticCurveTo(x, base - s * 0.34, x - s * 0.74, base - s * 0.44)
      ctx.closePath()
      ctx.rect(x - s * 0.5, base - s * 0.44, s * 1.0, s * 0.44)
      break

    // Vasija de luna: casi una esfera, con la boca corta y el pie corto.
    case 'vasija':
      circulo(ctx, x, base - s * 0.5, s * 0.4)
      ctx.rect(x - s * 0.17, base - s * 0.93, s * 0.34, s * 0.14)
      ctx.rect(x - s * 0.21, base - s * 0.14, s * 0.42, s * 0.14)
      break

    // Caqui: la fruta, con el cáliz de cuatro puntas y el cabito.
    case 'caqui':
      elipse(ctx, x, base - s * 0.38, s * 0.4, s * 0.34)
      ctx.moveTo(x - s * 0.36, base - s * 0.64)
      ctx.lineTo(x, base - s * 0.56)
      ctx.lineTo(x + s * 0.36, base - s * 0.64)
      ctx.lineTo(x, base - s * 0.82)
      ctx.closePath()
      ctx.rect(x - s * 0.04, base - s * 0.96, s * 0.08, s * 0.18)
      break

    // Urraca: la de la suerte. Cuerpo inclinado, cabeza, pico y la cola larga.
    case 'urraca':
      elipse(ctx, x, base - s * 0.46, s * 0.3, s * 0.19, -0.34)
      circulo(ctx, x - s * 0.27, base - s * 0.63, s * 0.12)
      ctx.moveTo(x - s * 0.36, base - s * 0.68)
      ctx.lineTo(x - s * 0.58, base - s * 0.64)
      ctx.lineTo(x - s * 0.36, base - s * 0.58)
      ctx.closePath()
      ctx.moveTo(x + s * 0.16, base - s * 0.52)
      ctx.lineTo(x + s * 0.8, base - s * 0.16)
      ctx.lineTo(x + s * 0.66, base - s * 0.06)
      ctx.lineTo(x + s * 0.1, base - s * 0.36)
      ctx.closePath()
      ctx.rect(x - s * 0.12, base - s * 0.34, s * 0.05, s * 0.34)
      ctx.rect(x + s * 0.04, base - s * 0.34, s * 0.05, s * 0.34)
      break

    // Portal: torii. Dos columnas apenas abiertas, el travesaño y el dintel
    // curvo con las puntas para arriba.
    case 'portal':
      ctx.moveTo(x - s * 0.54, base)
      ctx.lineTo(x - s * 0.42, base - s * 0.84)
      ctx.lineTo(x - s * 0.3, base - s * 0.84)
      ctx.lineTo(x - s * 0.38, base)
      ctx.closePath()
      ctx.moveTo(x + s * 0.54, base)
      ctx.lineTo(x + s * 0.42, base - s * 0.84)
      ctx.lineTo(x + s * 0.3, base - s * 0.84)
      ctx.lineTo(x + s * 0.38, base)
      ctx.closePath()
      ctx.rect(x - s * 0.5, base - s * 0.68, s * 1.0, s * 0.08)
      ctx.moveTo(x - s * 0.86, base - s * 0.86)
      ctx.quadraticCurveTo(x, base - s * 0.74, x + s * 0.86, base - s * 0.86)
      ctx.lineTo(x + s * 0.86, base - s * 0.96)
      ctx.quadraticCurveTo(x, base - s * 0.84, x - s * 0.86, base - s * 0.96)
      ctx.closePath()
      break

    // Farol de piedra: base, poste, caja de luz, techo y remate.
    case 'farol':
      ctx.rect(x - s * 0.27, base - s * 0.1, s * 0.54, s * 0.1)
      ctx.rect(x - s * 0.1, base - s * 0.44, s * 0.2, s * 0.34)
      ctx.rect(x - s * 0.28, base - s * 0.68, s * 0.56, s * 0.24)
      ctx.moveTo(x - s * 0.48, base - s * 0.68)
      ctx.lineTo(x - s * 0.3, base - s * 0.86)
      ctx.lineTo(x + s * 0.3, base - s * 0.86)
      ctx.lineTo(x + s * 0.48, base - s * 0.68)
      ctx.closePath()
      circulo(ctx, x, base - s * 0.92, s * 0.09)
      break

    // Pagoda: tres techos, cada uno más chico, y la aguja.
    case 'pagoda':
      for (let i = 0; i < 3; i++) {
        const y = base - s * (0.28 + i * 0.26)
        const w = s * (0.7 - i * 0.14)
        ctx.moveTo(x - w, y)
        ctx.quadraticCurveTo(x, y - s * 0.06, x + w, y)
        ctx.lineTo(x + w * 0.62, y - s * 0.16)
        ctx.lineTo(x - w * 0.62, y - s * 0.16)
        ctx.closePath()
      }
      ctx.rect(x - s * 0.22, base - s * 0.28, s * 0.44, s * 0.28)
      ctx.rect(x - s * 0.03, base - s * 1.0, s * 0.06, s * 0.2)
      break

    // Montaña: las laderas cóncavas y la cumbre chata. Es el Fuji y se sabe.
    case 'montaña':
      ctx.moveTo(x - s * 2.4, base)
      ctx.quadraticCurveTo(x - s * 1.0, base - s * 0.5, x - s * 0.36, base - s * 1.5)
      ctx.lineTo(x - s * 0.16, base - s * 1.6)
      ctx.lineTo(x + s * 0.16, base - s * 1.6)
      ctx.lineTo(x + s * 0.36, base - s * 1.5)
      ctx.quadraticCurveTo(x + s * 1.0, base - s * 0.5, x + s * 2.4, base)
      ctx.closePath()
      break

    // Onda: la cresta que se voltea sobre sí misma.
    case 'onda':
    default:
      ctx.moveTo(x - s * 1.15, base)
      ctx.quadraticCurveTo(x - s * 0.6, base - s * 0.2, x - s * 0.22, base - s * 0.72)
      ctx.quadraticCurveTo(x - s * 0.02, base - s * 0.98, x + s * 0.36, base - s * 0.86)
      ctx.quadraticCurveTo(x + s * 0.1, base - s * 0.8, x + s * 0.06, base - s * 0.56)
      ctx.quadraticCurveTo(x + s * 0.04, base - s * 0.32, x + s * 0.48, base - s * 0.22)
      ctx.quadraticCurveTo(x + s * 0.9, base - s * 0.12, x + s * 1.15, base)
      ctx.closePath()
      break
  }
  ctx.fill()
}

/**
 * La luz propia de cada forma: lo que está prendido, lo que es blanco, lo que
 * refleja. Es lo que hace que una silueta se lea como un lugar de noche y no
 * como un bloque. Las que no tienen luz —las lomas, la urraca— no dibujan nada.
 */
export function luz(ctx: CanvasRenderingContext2D, tipo: string, x: number, base: number, s: number): void {
  ctx.beginPath()
  switch (tipo) {
    // La ventana del hanok, con la celosía en cruz.
    case 'hanok':
      ctx.rect(x - s * 0.2, base - s * 0.36, s * 0.4, s * 0.26)
      break
    // El reflejo de la luna sobre la vasija.
    case 'vasija':
      elipse(ctx, x - s * 0.14, base - s * 0.62, s * 0.09, s * 0.14, -0.5)
      break
    case 'caqui':
      elipse(ctx, x - s * 0.14, base - s * 0.46, s * 0.08, s * 0.1, -0.5)
      break
    // Las dos linternas colgadas del travesaño.
    case 'portal':
      circulo(ctx, x - s * 0.22, base - s * 0.56, s * 0.07)
      circulo(ctx, x + s * 0.22, base - s * 0.56, s * 0.07)
      break
    // La caja de luz, que es para lo que existe el farol.
    case 'farol':
      ctx.rect(x - s * 0.2, base - s * 0.64, s * 0.4, s * 0.16)
      break
    // Una ventana por piso.
    case 'pagoda':
      ctx.rect(x - s * 0.06, base - s * 0.22, s * 0.12, s * 0.12)
      ctx.rect(x - s * 0.05, base - s * 0.48, s * 0.1, s * 0.1)
      break
    // La nieve de la cumbre.
    case 'montaña':
      ctx.moveTo(x - s * 0.36, base - s * 1.5)
      ctx.lineTo(x - s * 0.16, base - s * 1.6)
      ctx.lineTo(x + s * 0.16, base - s * 1.6)
      ctx.lineTo(x + s * 0.36, base - s * 1.5)
      ctx.quadraticCurveTo(x + s * 0.5, base - s * 1.2, x + s * 0.3, base - s * 1.18)
      ctx.quadraticCurveTo(x, base - s * 1.3, x - s * 0.3, base - s * 1.18)
      ctx.quadraticCurveTo(x - s * 0.5, base - s * 1.2, x - s * 0.36, base - s * 1.5)
      ctx.closePath()
      break
    // La espuma de la cresta.
    case 'onda':
      circulo(ctx, x + s * 0.3, base - s * 0.9, s * 0.08)
      circulo(ctx, x + s * 0.48, base - s * 0.8, s * 0.06)
      circulo(ctx, x + s * 0.14, base - s * 0.86, s * 0.05)
      break
    default:
      return
  }
  ctx.fill()
}
