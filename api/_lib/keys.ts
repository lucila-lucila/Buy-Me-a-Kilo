/**
 * Nombres de las claves en KV. Todos los valores son enteros agregados.
 * No existe ninguna clave por persona: no hay filas, solo sumas.
 */
export const K = {
  totalKilos: 'total_kilos',
  weekKilos: (w: string) => `week_${w}`,
  grossTotal: 'gross_cents_total',
  grossWeek: (w: string) => `gross_cents_${w}`,
  grossOther: 'gross_other_currency_events',
  tierTotal: (kilos: number) => `count_tier_${kilos}`,
  tierWeek: (kilos: number, w: string) => `count_tier_${kilos}_${w}`,
  contribTotal: 'count_contrib_total',
  contribWeek: (w: string) => `count_contrib_${w}`,
  shareGenerated: 'share_generated',
  dedupe: (txid: string) => `tx:${txid}`,
} as const
