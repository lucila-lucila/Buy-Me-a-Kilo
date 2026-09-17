import { webpSrc } from '../../../config/stickers'

/**
 * Lo que se junta y lo que se esquiva.
 *
 * Se juntan cosas que entran en la valija: los bichos del mundo de los
 * stickers, en silueta luminosa. Cada uno vale según su tamaño, y los chicos
 * salen más seguido.
 *
 * Se esquivan cosas que no entran en ningún avión: el cargo por exceso de
 * equipaje, la botella de más de cien mililitros, la tijera, el encendedor y
 * la batería suelta. Son opacas, pesadas y sin luz propia. Esa es la única
 * señal que necesita el jugador, y tiene que leerse en medio segundo: lo que
 * brilla se agarra, lo que no brilla se esquiva.
 */
export interface Bueno {
  sprite: string
  /** Radio en fracción del radio de Kilo. */
  tamaño: number
  gramos: number
}

/** El color de todo lo que se junta: el menta de la página. */
export const MENTA: [number, number, number] = [123, 240, 200]

const CHICO = { tamaño: 0.72, gramos: 5 }
const MEDIANO = { tamaño: 0.95, gramos: 12 }

/** Los siete que salen de la bolsa. El pasaporte no: ese va aparte. */
const CATALOGO: { id: string; clase: typeof CHICO }[] = [
  { id: 'sticker_03', clase: CHICO }, // media
  { id: 'sticker_04', clase: CHICO }, // nube
  { id: 'sticker_07', clase: CHICO }, // luna
  { id: 'sticker_05', clase: MEDIANO }, // onigiri
  { id: 'sticker_08', clase: MEDIANO }, // mate
  { id: 'sticker_02', clase: MEDIANO }, // medusa
  { id: 'sticker_01', clase: MEDIANO }, // conejo
]

/**
 * El pasaporte vale el riesgo. No sale de la bolsa: aparece cada tanto, en
 * un lugar difícil —pegado a algo que se esquiva, o arriba de todo— para que
 * ir a buscarlo sea una decisión y no suerte.
 */
export const PASAPORTE: Bueno = { sprite: webpSrc('sticker_10'), tamaño: 1.3, gramos: 40 }

/**
 * La bolsa de la que sale cada objeto. Los chicos van tres veces y los
 * medianos dos: es lo que hace que los chicos aparezcan más seguido.
 */
export const BUENOS: Bueno[] = CATALOGO.flatMap(({ id, clase }) =>
  Array.from({ length: clase === CHICO ? 3 : 2 }, () => ({ sprite: webpSrc(id), ...clase })),
)

export const SPRITES_BUENOS = [...new Set([...BUENOS, PASAPORTE].map((b) => b.sprite))]

/** Uno al azar. Sin rachas ni pity: es un juego, no un casino. */
export const sacar = (): Bueno => BUENOS[Math.floor(Math.random() * BUENOS.length)]

// ---------------------------------------------------------------- los malos

export type Malo = 'cargo' | 'botella' | 'tijera' | 'encendedor' | 'bateria'

export const MALOS: Malo[] = ['cargo', 'botella', 'tijera', 'encendedor', 'bateria']

/** Rojo apagado, opaco. Sin brillo: es lo único del juego que no lo tiene. */
export const ROJO = '#7a2233'
export const ROJO_BORDE = '#3a0d16'

const TAU = Math.PI * 2

/**
 * Cada cosa a esquivar, centrada en (x, y) y de radio `r`. Rellenas de rojo
 * apagado, con el borde duro y más oscuro. Nada de esto brilla.
 */
export function dibujarMalo(ctx: CanvasRenderingContext2D, tipo: Malo, x: number, y: number, r: number): void {
  ctx.fillStyle = ROJO
  ctx.strokeStyle = ROJO_BORDE
  ctx.lineWidth = Math.max(1.5, r * 0.12)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  switch (tipo) {
    // La etiqueta del cargo: un rótulo con la punta cortada y el ojal.
    case 'cargo': {
      ctx.moveTo(x - r * 0.95, y - r * 0.55)
      ctx.lineTo(x + r * 0.55, y - r * 0.55)
      ctx.lineTo(x + r * 0.95, y)
      ctx.lineTo(x + r * 0.55, y + r * 0.55)
      ctx.lineTo(x - r * 0.95, y + r * 0.55)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x + r * 0.62, y, r * 0.12, 0, TAU)
      ctx.fillStyle = ROJO_BORDE
      ctx.fill()
      // El símbolo, para que se lea como cargo y no como cualquier rótulo.
      ctx.fillStyle = ROJO_BORDE
      ctx.font = `700 ${Math.round(r * 0.9)}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', x - r * 0.25, y + r * 0.04)
      return
    }
    // La botella: cuello, hombros y cuerpo.
    case 'botella':
      ctx.moveTo(x - r * 0.22, y - r * 1.0)
      ctx.lineTo(x + r * 0.22, y - r * 1.0)
      ctx.lineTo(x + r * 0.22, y - r * 0.55)
      ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.45, x + r * 0.5, y - r * 0.15)
      ctx.lineTo(x + r * 0.5, y + r * 0.85)
      ctx.quadraticCurveTo(x + r * 0.5, y + r * 1.0, x + r * 0.35, y + r * 1.0)
      ctx.lineTo(x - r * 0.35, y + r * 1.0)
      ctx.quadraticCurveTo(x - r * 0.5, y + r * 1.0, x - r * 0.5, y + r * 0.85)
      ctx.lineTo(x - r * 0.5, y - r * 0.15)
      ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.45, x - r * 0.22, y - r * 0.55)
      ctx.closePath()
      break
    // La tijera: dos hojas en cruz y las dos argollas.
    case 'tijera':
      ctx.moveTo(x - r * 0.15, y - r * 0.1)
      ctx.lineTo(x + r * 0.85, y - r * 0.95)
      ctx.lineTo(x + r * 0.98, y - r * 0.72)
      ctx.lineTo(x + r * 0.05, y + r * 0.1)
      ctx.closePath()
      ctx.moveTo(x + r * 0.15, y - r * 0.1)
      ctx.lineTo(x - r * 0.85, y - r * 0.95)
      ctx.lineTo(x - r * 0.98, y - r * 0.72)
      ctx.lineTo(x - r * 0.05, y + r * 0.1)
      ctx.closePath()
      ctx.moveTo(x - r * 0.06, y + r * 0.5)
      ctx.arc(x - r * 0.36, y + r * 0.5, r * 0.3, 0, TAU)
      ctx.moveTo(x + r * 0.66, y + r * 0.5)
      ctx.arc(x + r * 0.36, y + r * 0.5, r * 0.3, 0, TAU)
      break
    // El encendedor: el cuerpo, la tapa y la rueda.
    case 'encendedor':
      ctx.rect(x - r * 0.38, y - r * 0.45, r * 0.76, r * 1.45)
      ctx.rect(x - r * 0.38, y - r * 0.75, r * 0.76, r * 0.3)
      ctx.moveTo(x + r * 0.32, y - r * 0.9)
      ctx.arc(x + r * 0.12, y - r * 0.9, r * 0.2, 0, TAU)
      break
    // La batería suelta: el cilindro y el polo.
    case 'bateria':
    default:
      ctx.rect(x - r * 0.42, y - r * 0.8, r * 0.84, r * 1.7)
      ctx.rect(x - r * 0.16, y - r * 0.98, r * 0.32, r * 0.18)
      break
  }
  ctx.fill()
  ctx.stroke()
}
