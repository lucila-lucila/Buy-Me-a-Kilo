const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen',
]

/** Números en palabras hasta trece; de ahí en más, en dígitos. */
function asWord(n: number): string {
  return WORDS[n] ?? String(n)
}

/**
 * Todo el texto de la página. Seco, sin signos de exclamación, sin emojis, sin
 * agradecer. La narradora no se presenta y no explica por qué viaja.
 */
export const copy = {
  hero: {
    title: 'Buy me a kilo',
    /**
     * La línea operativa va arriba del fold, sola: es la que explica qué se
     * compra. El resto del relato entra apenas abajo, después de los tiers.
     * Es lo que pedía el primer brief: valija, una línea de copy y los cuatro
     * tiers en la primera pantalla.
     */
    lead: "Fill a kilo, get a sticker. You don't get to pick which one.",
    /** `{when}` lo completa el servidor: nunca dice cinco semanas cuando faltan tres. */
    prose: [
      'I have 23 kilos. Most of them are empty.',
      "There is one suitcase. It's mine. It leaves for Japan in {when}.",
      'Then there will be another suitcase, and another country.',
      'That part is not your problem yet.',
    ],
  },

  suitcase: {
    label: (n: number) => `suitcase #${n}`,
    note: (n: number) => `the first ${asWord(n - 1)} are already packed.`,
    /** La primera valija todavía no tiene historia detrás. */
    noteFirst: 'nothing is packed yet.',
    /** Recién estrenada: la anterior acaba de cerrarse. */
    justClosed: (n: number) => `#${n - 1} just closed. this one is empty.`,
    progress: (kilos: number, capacity: number) => `${kilos} of ${capacity} kg`,
    straining: 'this one is almost shut.',
  },

  people: {
    count: (n: number) => `${n.toLocaleString('en-US')} people so far`,
    /**
     * Declara el origen del arrastre en voz alta. Un número explicado es más
     * fuerte que uno que aparece solo, y la página se sostiene sobre decir la
     * verdad sobre sí misma. No sacar.
     */
    note: 'most of them before this page existed. they came from somewhere else.',
  },

  countdown: {
    /** Semanas mientras falten 14 días o más, después días. */
    line: (days: number) =>
      days <= 0
        ? 'the plane has left.'
        : days === 1
          ? 'one day until the plane leaves'
          : days < 14
            ? `${days} days until the plane leaves`
            : `${asWord(Math.round(days / 7))} weeks until the plane leaves`,
    /** El mismo dato dentro de la línea del hero. */
    inline: (days: number) =>
      days <= 0 ? 'a while ago' : days === 1 ? 'a day' : days < 14 ? `${asWord(days)} days` : `${asWord(Math.round(days / 7))} weeks`,
  },

  departed: {
    line: 'the plane left. thank you. the next suitcase opens soon.',
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
    /** Una línea más chica y más tibia, en el mismo registro seco. */
    signature: 'made by hand, in the dark, at an hour that was not reasonable.',
  },

  open: {
    filling: 'The suitcase takes it.',
    shaking: 'Something is in the bag.',
    duplicate: 'duplicate. the suitcase sighs.',
    /**
     * Sin atribuir. /open no sabe si el kilo de quien está mirando cerró la
     * valija: el webhook y la visita son independientes, y la URL es abierta a
     * propósito. Atribuirlo sería mentirle a casi todos los que lo lean.
     */
    suitcaseClosed: (n: number) => `suitcase #${n - 1} just closed. #${n} is now open.`,
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

  domain: 'buymeakilo.com',
} as const
