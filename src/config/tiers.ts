/**
 * Los cuatro tiers, tal como los ve el cliente.
 *
 * Acá NO hay precios. La persona ve kilos; el precio aparece completo recién en
 * el checkout de Ko-fi, antes de pagar. Los montos viven solo en
 * api/_lib/economy.ts, que también importa esta lista para mapear el
 * direct_link_code de cada compra a kilos.
 *
 * `kofiItemCode` es el código de la URL pública del item de Ko-fi
 * (ko-fi.com/s/<code>). Es público por definición: no es un dato sensible.
 */
export type TierId = 'one' | 'three' | 'carry' | 'overweight'

export interface Tier {
  id: TierId
  label: string
  kilos: number
  /** Nota corta bajo el label. Sin badges de "most popular", sin escasez. */
  note: string
  kofiItemCode: string
  /** El más grande de los cuatro y primero en el orden de tabulación. */
  feature?: boolean
}

/** El orden del array es el orden del DOM, y por lo tanto el del teclado. */
export const TIERS: Tier[] = [
  {
    id: 'three',
    label: 'Three kilos',
    kilos: 3,
    note: 'three kilos, one sticker',
    kofiItemCode: 'PLACEHOLDER_THREE',
    feature: true,
  },
  { id: 'one', label: 'One kilo', kilos: 1, note: 'the smallest unit', kofiItemCode: 'PLACEHOLDER_ONE' },
  { id: 'carry', label: 'Carry-on', kilos: 6, note: 'six kilos', kofiItemCode: 'PLACEHOLDER_CARRY' },
  {
    id: 'overweight',
    label: 'Overweight fee',
    kilos: 12,
    note: 'twelve kilos. this one needs an address. the only one that does.',
    kofiItemCode: 'PLACEHOLDER_OVERWEIGHT',
  },
]

/**
 * Usuario de Ko-fi. Vacío a propósito hasta que exista la cuenta.
 *
 * No poner uno inventado: si ese handle le pertenece a otra persona, cada
 * visitante que quiere pagar termina en el Ko-fi de un desconocido. Un botón
 * que no anda es mucho menos grave.
 */
export const KOFI_USERNAME = 'buymeaKilo'

/**
 * URL del item en Ko-fi, o null si el tier todavía no está configurado.
 * El precio se ve ahí, entero, antes de pagar.
 */
export function kofiUrl(tier: Tier): string | null {
  if (!tier.kofiItemCode.startsWith('PLACEHOLDER')) {
    return `https://ko-fi.com/s/${tier.kofiItemCode}`
  }
  return KOFI_USERNAME ? `https://ko-fi.com/${KOFI_USERNAME}` : null
}

/** Los tiers que todavía tienen el código de Ko-fi sin cargar. */
export const unconfiguredTiers = (): Tier[] => TIERS.filter((t) => kofiUrl(t) === null)
