import { STICKERS, RARITY_WEIGHTS, type Rarity, type Sticker } from '../config/stickers'

/**
 * Elige un sticker en el cliente. Primero la rareza por peso, después uno
 * parejo dentro del grupo. Cada tirada es independiente: sin rachas, sin pity
 * timer, sin "te falta poco para la rara".
 */
export function rollSticker(random: () => number = Math.random): Sticker {
  const buckets = Object.entries(RARITY_WEIGHTS) as [Rarity, number][]
  const total = buckets.reduce((sum, [, w]) => sum + w, 0)
  let r = random() * total

  let chosen: Rarity = buckets[buckets.length - 1][0]
  for (const [rarity, weight] of buckets) {
    if (r < weight) {
      chosen = rarity
      break
    }
    r -= weight
  }

  const pool = STICKERS.filter((s) => s.rarity === chosen)
  return pool[Math.floor(random() * pool.length)] ?? STICKERS[0]
}
