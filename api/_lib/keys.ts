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
  contribTotal: 'count_contrib_total',
  contribWeek: (w: string) => `count_contrib_${w}`,
  shareGenerated: 'share_generated',
  /** Serie de los stickers entregados. Un entero que solo sube. */
  stickerSerial: 'sticker_serial',
  /** Marca de "esta transacción ya se contó". Se borra sola a los 7 días. */
  dedupe: (txid: string) => `tx:${txid}`,
  /**
   * Lo mismo para el id del evento. Prefijo aparte a propósito: son dos espacios
   * de nombres distintos y no se pisan entre sí.
   */
  dedupeMessage: (messageId: string) => `msg:${messageId}`,
} as const
