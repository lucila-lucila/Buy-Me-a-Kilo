/**
 * Todo el texto de la página. Seco, sin signos de exclamación, sin emojis, sin
 * agradecer. La narradora no se presenta y no explica por qué viaja.
 */
export const copy = {
  hero: {
    title: 'Buy me a kilo',
    lines: [
      'I have 23 kilos. Most of them are empty.',
      "There is one suitcase. It's mine. That's the entire operation.",
      "Fill a kilo, get a sticker. You don't get to pick which one.",
    ],
  },

  counter: {
    unit: 'kilos',
    weekLabel: 'this week',
    goalSuffix: (goal: number) => `of ${goal} kg`,
    overweight: 'The suitcase is now illegal. Continue anyway.',
    stale: 'last known count',
  },

  tiers: {
    heading: 'Fill a kilo',
    priceNote: 'The price shows up in checkout, before you pay.',
    /** Cuando los items de Ko-fi todavía no existen. */
    unconfigured: 'The shop is not open yet.',
  },

  grid: {
    heading: 'Twelve of these exist. You get one.',
  },

  privacy: {
    lines: [
      "I don't know who you are. I don't want to know.",
      'Your stickers live in your browser and nowhere else.',
    ],
  },

  footer: {
    lines: ['No account. No email. No newsletter.', 'You will never hear from me again.'],
  },

  open: {
    filling: 'The suitcase takes it.',
    shaking: 'Something is in the bag.',
    duplicate: 'duplicate. the suitcase sighs.',
    rarity: {
      common: 'common. it counts the same.',
      rare: 'rare. nothing happens differently.',
      cursed: 'cursed. it came out wrong and it stays that way.',
    } as const,
    download: 'Download the sticker',
    share: 'Make a shareable image',
    sharing: 'Composing',
    shared: 'Saved',
    back: 'Back to the suitcase',
    collection: (n: number) => (n === 1 ? 'you have 1 of twelve' : `you have ${n} of twelve`),
    noPurchase: 'You can be here without having paid. I am not going to stop you.',
  },

  /** Una línea por rareza en la tarjeta para compartir. */
  shareCard: {
    common: 'i bought a kilo.',
    rare: 'i got a rare one.',
    cursed: 'i got the sad one.',
  } as const,

  /**
   * Solo el respaldo para localhost. En producción el pie de la tarjeta usa el
   * dominio real desde el que se abrió la página: ver src/lib/domain.ts.
   */
  domain: 'buymeakilo.com',
} as const
