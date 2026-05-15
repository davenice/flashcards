function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const correctMessages = [
  'Oui oui!',
  'Magnifique!',
  'Your beret is glowing.',
  "C'est parfait!",
  'Mon dieu, vous êtes brillant.',
  'The Eiffel Tower nods.',
  'Très bien!',
  'Formidable!',
  'France weeps with joy.',
  'Absolument oui.',
  'Allons-y!',
  'Napoléon would approve.',
  'The sommelier nods.',
  'Your croissant has been earned.',
  'Even the mime is impressed.',
  'The boulangerie is proud.',
  'Le mot juste. Exactly.',
  'The accordion plays in your honour.',
  'Sacré correct!',
  "C'est la victoire!",
  'Le Tour de France slows to applaud.',
  'The café approves. ☕',
  'Vite, vite! On to the next.',
]

const incorrectMessages = [
  'Le sigh.',
  "C'est la vie.",
  'The baguette weeps.',
  'The French shall forgive you.',
  'Almost... but non.',
  "Not quite, mon ami.",
  'Even the croissant is disappointed.',
  'Paris will recover.',
  'Sacré bleu!',
]

const redemptionMessages = [
  'From the ashes!',
  'The prodigal word returns.',
  'You remembered! Miracles happen.',
  'Forgiven. This time.',
  'Like you never forgot.',
  'Redemption arc complete.',
  'The comeback kid!',
  'Memory: unlocked.',
]

const milestoneMessages: Record<number, string[]> = {
  5: [
    '5 down. Only 3,000 French words to go.',
    'Five! Starting to get dangerous.',
    'High five! (cinq!)',
  ],
  10: [
    'Double figures. Dangerous.',
    'Dix! You absolute machine.',
    'Ten correct. The French are nervous.',
  ],
}

const milestoneMessagesFallback = [
  "You're basically French now.",
  'At this point just move to Paris.',
  'Someone stop this person.',
  'The language is begging for mercy.',
]

export function getCorrectMessage(): string {
  return pick(correctMessages)
}

export function getIncorrectMessage(): string {
  return pick(incorrectMessages)
}

export function getRedemptionMessage(): string {
  return pick(redemptionMessages)
}

export function getMilestoneMessage(correctCount: number): string {
  const pool = milestoneMessages[correctCount] ?? milestoneMessagesFallback
  return pick(pool)
}
