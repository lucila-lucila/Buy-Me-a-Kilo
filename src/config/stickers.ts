export type Rarity = 'common' | 'rare' | 'cursed'

export interface Sticker {
  id: string
  /** Alt text. Deadpan, en minúscula. */
  alt: string
  rarity: Rarity
}

export const STICKERS: Sticker[] = [
  { id: 'sticker_01', alt: 'a rabbit', rarity: 'common' },
  { id: 'sticker_02', alt: 'a jellyfish', rarity: 'common' },
  { id: 'sticker_03', alt: 'a sock', rarity: 'common' },
  { id: 'sticker_04', alt: 'a cloud', rarity: 'common' },
  { id: 'sticker_05', alt: 'an onigiri', rarity: 'common' },
  { id: 'sticker_06', alt: 'a plane', rarity: 'common' },
  { id: 'sticker_07', alt: 'a moon', rarity: 'common' },
  { id: 'sticker_08', alt: 'a mate', rarity: 'common' },
  { id: 'sticker_09', alt: 'a pet of unclear species', rarity: 'rare' },
  { id: 'sticker_10', alt: 'a passport', rarity: 'rare' },
  { id: 'sticker_11', alt: 'a one kilo weight', rarity: 'rare' },
  { id: 'sticker_12', alt: 'the sad one', rarity: 'cursed' },
]

/**
 * Peso por rareza. Se reparte parejo dentro de cada grupo, así que agregar un
 * sticker no obliga a recalcular ninguna tabla.
 * Sin rachas, sin pity timers, sin "te falta poco para la rara". Es un chiste,
 * no un casino.
 */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 0.75,
  rare: 0.2,
  cursed: 0.05,
}

export const webpSrc = (id: string) => `/stickers/webp/${id}.webp`
export const pngSrc = (id: string) => `/stickers/png/${id}.png`

export const byId = (id: string): Sticker | undefined => STICKERS.find((s) => s.id === id)
