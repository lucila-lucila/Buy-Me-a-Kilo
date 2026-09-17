/**
 * El paisaje de Layover, dibujado con formas y no con imágenes.
 *
 * Los dos ecosistemas ilustrados todavía no existen como archivo, así que por
 * ahora las siluetas van hechas con paths en la paleta de la página: neón sobre
 * oscuro, que es el idioma del sitio. Cuando lleguen los dibujos, cada `case` de
 * acá se reemplaza por un drawImage y el resto del juego no se entera.
 *
 * Corea primero, Japón después. Cada mitad tiene su color dominante y sus
 * elementos: techo de hanok, vasija de luna, caqui y urraca de un lado; portal,
 * farol, montaña y onda del otro.
 *
 * El verde menta no está en ninguna de las dos paletas y no puede estar: es el
 * color de los gramos, lo único que se junta. Si el paisaje también fuera
 * menta, en un cuadro cargado habría que pensar qué es cada cosa, y este es un
 * juego de reflejos.
 *
 * Todo se dibuja como siluetas llenas y cerradas. Una línea suelta no pinta
 * nada: si una forma necesita un detalle fino, es un rectángulo flaco, no un
 * `lineTo`. Y todo arco va precedido de un `moveTo` a su propio punto de
 * arranque, porque si no el `fill` lo une con la figura anterior y aparece una
 * astilla de color donde no va nada.
 */
export type Pais = 'korea' | 'japan'

export interface Pieza {
  /** Qué tan lejos está: 0 es el fondo, 1 el frente. Define su velocidad. */
  capa: number
  tipo: string
  x: number
  /** Variación de tamaño, alrededor de 1. Dos hanoks nunca miden igual. */
  escala: number
}

export const PALETA: Record<Pais, { lejos: string; cerca: string; cielo: string; horizonte: string }> = {
  korea: {
    lejos: 'rgba(255, 162, 76, 0.32)',
    cerca: 'rgba(255, 79, 163, 0.42)',
    cielo: 'rgba(255, 79, 163, 0.10)',
    horizonte: 'rgba(255, 162, 76, 0.55)',
  },
  japan: {
    lejos: 'rgba(59, 123, 255, 0.36)',
    cerca: 'rgba(132, 112, 255, 0.46)',
    cielo: 'rgba(59, 123, 255, 0.12)',
    horizonte: 'rgba(59, 123, 255, 0.60)',
  },
}

const FORMAS: Record<Pais, string[]> = {
  korea: ['hanok', 'vasija', 'caqui', 'urraca'],
  japan: ['portal', 'farol', 'montaña', 'onda'],
}

export const formaDe = (pais: Pais, i: number): string => {
  const f = FORMAS[pais]
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
 * Cada silueta, apoyada en (x, base) y de `s` píxeles de alto.
 *
 * `s` es el alto: el ancho de cada forma sale de sus propias proporciones y
 * puede pasarse un poco para los dos lados.
 */
export function dibujar(ctx: CanvasRenderingContext2D, tipo: string, x: number, base: number, s: number): void {
  ctx.beginPath()
  switch (tipo) {
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

    // Montaña: las laderas cóncavas y la cumbre chata. Es el Fuji y se sabe.
    case 'montaña':
      ctx.moveTo(x - s * 1.1, base)
      ctx.quadraticCurveTo(x - s * 0.46, base - s * 0.3, x - s * 0.22, base - s * 0.84)
      ctx.lineTo(x - s * 0.1, base - s * 0.9)
      ctx.lineTo(x + s * 0.1, base - s * 0.9)
      ctx.lineTo(x + s * 0.22, base - s * 0.84)
      ctx.quadraticCurveTo(x + s * 0.46, base - s * 0.3, x + s * 1.1, base)
      ctx.closePath()
      break

    // Onda: la cresta que se voltea sobre sí misma, con dos gotas de espuma.
    case 'onda':
    default:
      ctx.moveTo(x - s * 1.15, base)
      ctx.quadraticCurveTo(x - s * 0.6, base - s * 0.2, x - s * 0.22, base - s * 0.72)
      ctx.quadraticCurveTo(x - s * 0.02, base - s * 0.98, x + s * 0.36, base - s * 0.86)
      ctx.quadraticCurveTo(x + s * 0.1, base - s * 0.8, x + s * 0.06, base - s * 0.56)
      ctx.quadraticCurveTo(x + s * 0.04, base - s * 0.32, x + s * 0.48, base - s * 0.22)
      ctx.quadraticCurveTo(x + s * 0.9, base - s * 0.12, x + s * 1.15, base)
      ctx.closePath()
      circulo(ctx, x + s * 0.45, base - s * 0.92, s * 0.07)
      circulo(ctx, x + s * 0.64, base - s * 0.8, s * 0.05)
      break
  }
  ctx.fill()
}
