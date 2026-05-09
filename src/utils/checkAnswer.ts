export type MatchResult =
  | { outcome: 'exact' }
  | { outcome: 'accepted'; canonical: string }
  | { outcome: 'incorrect' }

export function checkAnswer(_userInput: string, _expected: string): MatchResult {
  return { outcome: 'incorrect' }
}
