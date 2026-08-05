/**
 * The canonical taste tags. Places are described with a subset of these, and
 * question options nudge the user's weight on them. Keeping one flat, shared
 * vocabulary is what lets the rules engine (and later Claude) reason about fit.
 *
 * Grouped into "axes" only for readability + the next-question heuristic; the
 * scoring itself treats every tag independently.
 */
export const TAGS = {
  // atmosphere
  quiet: 'quiet',
  lively: 'lively',
  bright: 'bright', // daylight / windows
  moody: 'moody', // low, warm light
  // what you're there to do
  study: 'study',
  hangout: 'hangout',
  drinks: 'drinks',
  food: 'food',
  coffee: 'coffee',
  photo: 'photo',
  // practicalities
  outlets: 'outlets',
  comfy: 'comfy', // plush, linger-friendly seating
  solo: 'solo', // good alone
  group: 'group', // good for a table
  lingering: 'lingering', // nobody rushes you
  quick: 'quick', // in-and-out
  // budget
  cheap: 'cheap',
  splurge: 'splurge',
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];

/** Human labels for surfacing traits on the You screen. */
export const TAG_LABELS: Record<Tag, string> = {
  quiet: 'Quiet over lively',
  lively: 'Likes a buzz',
  bright: 'Daylight & windows',
  moody: 'Low, warm light',
  study: 'Heads-down spots',
  hangout: 'Hangout spots',
  drinks: 'A good drink',
  food: 'Somewhere to eat',
  coffee: 'Coffee-forward',
  photo: 'Photogenic places',
  outlets: 'Needs outlets',
  comfy: 'Comfortable seating',
  solo: 'Good solo',
  group: 'Good for a group',
  lingering: 'Lingers for hours',
  quick: 'In and out',
  splurge: 'Will splurge',
  cheap: 'Keeps it cheap',
};

/** Opposing pairs — answering one side gently pushes down its opposite. */
export const TAG_OPPOSITES: Partial<Record<Tag, Tag>> = {
  quiet: 'lively',
  lively: 'quiet',
  bright: 'moody',
  moody: 'bright',
  solo: 'group',
  group: 'solo',
  lingering: 'quick',
  quick: 'lingering',
  cheap: 'splurge',
  splurge: 'cheap',
};
