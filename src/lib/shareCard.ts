/**
 * Tarjeta para compartir: 1080x1350, compuesta en el cliente con <canvas>.
 * Sin servidor y sin librerías.
 *
 * Con tráfico frío esto es el motor entero de distribución: cada persona que
 * compra es un canal de un solo uso. Por eso la imagen se diseña para leerse en
 * miniatura, que es como la va a ver todo el mundo.
 */
import { copy } from '../copy'
import { pngSrc, type Rarity } from '../config/stickers'
import { siteDomain } from './domain'
import { formatSerial } from './serial'

const W = 1080
const H = 1350

const VOID = '#14091C'
const PAPER = '#FFF6EC'

const GLOW: Record<Rarity, [string, string]> = {
  common: ['rgba(59,123,255,0.55)', 'rgba(255,79,163,0.30)'],
  rare: ['rgba(255,79,163,0.65)', 'rgba(255,162,76,0.35)'],
  cursed: ['rgba(123,240,200,0.40)', 'rgba(59,123,255,0.22)'],
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`no carga ${src}`))
    img.src = src
  })
}

async function ensureFonts(): Promise<void> {
  if (!('fonts' in document)) return
  try {
    await Promise.all([
      document.fonts.load('400 92px "Bagel Fat One"'),
      document.fonts.load('500 40px "Familjen Grotesk"'),
    ])
  } catch {
    /* si la fuente no cargó, el fallback del sistema igual dibuja */
  }
}

export interface ShareCardInput {
  stickerId: string
  rarity: Rarity
  /** Total real de kilos, o null si todavía no llegó. */
  totalKilos: number | null
  /** Número de serie, o null si el servidor no lo pudo dar. Nunca uno inventado. */
  serial: number | null
}

export async function composeShareCard(input: ShareCardInput): Promise<Blob> {
  const [sticker] = await Promise.all([loadImage(pngSrc(input.stickerId)), ensureFonts()])

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('sin canvas 2d')

  ctx.fillStyle = VOID
  ctx.fillRect(0, 0, W, H)

  // Resplandor detrás del sticker. Es el mismo gradiente radial de la valija.
  const [inner, outer] = GLOW[input.rarity]
  const glow = ctx.createRadialGradient(W / 2, 600, 40, W / 2, 600, 640)
  glow.addColorStop(0, inner)
  glow.addColorStop(0.45, outer)
  glow.addColorStop(1, 'rgba(20,9,28,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // El PNG viene con fondo negro real, así que screen lo integra sin recorte.
  ctx.globalCompositeOperation = 'screen'
  const size = 880
  ctx.drawImage(sticker, (W - size) / 2, 600 - size / 2, size, size)
  ctx.globalCompositeOperation = 'source-over'

  ctx.textAlign = 'center'

  ctx.fillStyle = PAPER
  ctx.font = '400 92px "Bagel Fat One", sans-serif'
  ctx.shadowColor = 'rgba(255,79,163,0.55)'
  ctx.shadowBlur = 40
  ctx.fillText(copy.shareCard[input.rarity], W / 2, 1130)
  ctx.shadowBlur = 0

  if (input.totalKilos !== null) {
    ctx.fillStyle = 'rgba(255,246,236,0.68)'
    ctx.font = '500 42px "Familjen Grotesk", sans-serif'
    ctx.fillText(`${input.totalKilos.toLocaleString('en-US')} kilos in the suitcase`, W / 2, 1210)
  }

  ctx.fillStyle = 'rgba(255,246,236,0.62)'
  ctx.font = '500 36px "Familjen Grotesk", sans-serif'
  // El número de serie es lo único que hace distinta la tarjeta de cada persona.
  ctx.fillText(
    input.serial === null ? siteDomain() : `${formatSerial(input.serial)} · ${siteDomain()}`,
    W / 2,
    1288,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sin blob'))), 'image/png')
  })
}

/** Contador agregado, sin cuerpo y sin nada que identifique a nadie. */
function countShare(): void {
  try {
    void fetch('/api/share', { method: 'POST', keepalive: true }).catch(() => {})
  } catch {
    /* nunca puede romper la tarjeta */
  }
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'

/**
 * En mobile con soporte de archivos usa la hoja nativa; si no, descarga.
 */
export async function shareOrDownload(input: ShareCardInput): Promise<ShareOutcome> {
  const blob = await composeShareCard(input)
  const file = new File([blob], `buy-me-a-kilo-${input.stickerId}.png`, { type: 'image/png' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      countShare()
      return 'shared'
    } catch (err) {
      // El usuario cerró la hoja de compartir: no es un error, y no cae a descarga.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
    }
  }

  triggerDownload(blob, file.name)
  countShare()
  return 'downloaded'
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Descarga del PNG grande, tal cual está en el repo. */
export async function downloadSticker(stickerId: string): Promise<void> {
  const res = await fetch(pngSrc(stickerId))
  triggerDownload(await res.blob(), `${stickerId}.png`)
}
