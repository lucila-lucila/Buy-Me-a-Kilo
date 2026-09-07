/**
 * Nombres de las claves en KV. Todos los valores son enteros agregados.
 * No existe ninguna clave por persona: no hay filas, solo sumas.
 */
export const K = {
  /**
   * Gramos, no kilos: un aporte no llena un kilo, aporta una fracción. La clave
   * es nueva y no reusa total_kilos, que quedó con otra unidad.
   */
  totalGrams: 'total_grams',
  weekGrams: (w: string) => `grams_${w}`,
  grossTotal: 'gross_cents_total',
  grossWeek: (w: string) => `gross_cents_${w}`,
  grossOther: 'gross_other_currency_events',
  tierTotal: (kilos: number) => `count_tier_${kilos}`,
  tierWeek: (kilos: number, w: string) => `count_tier_${kilos}_${w}`,
  contribTotal: 'count_contrib_total',
  contribWeek: (w: string) => `count_contrib_${w}`,
  shareGenerated: 'share_generated',
  /** Serie de los stickers entregados. Un entero que solo sube. */
  stickerSerial: 'sticker_serial',
  dedupe: (txid: string) => `tx:${txid}`,
} as const
