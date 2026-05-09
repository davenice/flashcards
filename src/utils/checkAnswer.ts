export type MatchResult =
  | { outcome: 'exact' }
  | { outcome: 'accepted'; canonical: string }
  | { outcome: 'incorrect' }

type Gender = 'm' | 'f' | null

// Normalise apostrophe variants, case, and whitespace
function normaliseStr(s: string): string {
  return s
    .replace(/[’‘ʼ]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// Strip (m), (f), (m pl), (f pl) gender markers from anywhere in the string.
// Returns the stripped string and the first gender found (used to resolve l').
function extractGender(s: string): { gender: Gender; stripped: string } {
  let gender: Gender = null
  const stripped = s
    .replace(/\s*\((m pl|f pl|m|f)\)\s*/g, (_, marker) => {
      if (gender === null) {
        if (marker === 'm') gender = 'm'
        else if (marker === 'f') gender = 'f'
        // m pl / f pl → plural, l' resolution not needed
      }
      return ' '
    })
    .trim()
    .replace(/\s+/g, ' ')
  return { gender, stripped }
}

// Expand (e) and (es) markers into all combinations.
// mort(e)        → ['mort', 'morte']
// un(e) bénévole → ['un bénévole', 'une bénévole']
// amis(es)       → ['amis', 'amies']  — (es) strips the preceding char before adding 'es'
function expandE(s: string): string[] {
  const markers: Array<{ index: number; end: number; suffix: string }> = []
  const regex = /\(es?\)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(s)) !== null) {
    markers.push({ index: m.index, end: m.index + m[0].length, suffix: m[0].slice(1, -1) })
  }
  if (markers.length === 0) return [s]

  const results: string[] = []
  for (let mask = 0; mask < 1 << markers.length; mask++) {
    let result = ''
    let pos = 0
    for (let i = 0; i < markers.length; i++) {
      result += s.slice(pos, markers[i].index)
      if (mask & (1 << i)) {
        if (markers[i].suffix === 'es') result = result.slice(0, -1) // drop trailing char (e.g. 's' in 'amis')
        result += markers[i].suffix
      }
      pos = markers[i].end
    }
    result += s.slice(pos)
    results.push(result)
  }
  return results
}

// For parenthetical optional words like "la (pension de) retraite", produce
// variants with the content present or absent. Ignores gender markers and (e)/(es)
// since those are handled by extractGender and expandE respectively.
function optionalParenVariants(s: string): string[] {
  const positions: Array<{ start: number; end: number; content: string }> = []
  const regex = / \(([^)]+)\)(?= |$)/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(s)) !== null) {
    const content = m[1].trim()
    if (/^(m pl|f pl|m|f|es?)$/.test(content)) continue
    positions.push({ start: m.index, end: m.index + m[0].length, content: m[1] })
  }
  if (positions.length === 0) return []

  const results: string[] = []
  for (let mask = 0; mask < 1 << positions.length; mask++) {
    let result = s
    for (let i = positions.length - 1; i >= 0; i--) {
      const { start, end, content } = positions[i]
      if (mask & (1 << i)) {
        result = result.slice(0, start) + ' ' + content + result.slice(end)
      } else {
        result = result.slice(0, start) + result.slice(end)
      }
    }
    results.push(result.trim().replace(/\s+/g, ' '))
  }
  return results
}

// Split on slash. When one part is multi-word and another is a single word,
// also produce the prefix-substitution form so that "à temps plein/complet"
// yields both "à temps plein" and "à temps complet" (not just "complet").
function splitSlash(s: string): string[] {
  const rawParts = s.split('/').map(p => p.trim()).filter(Boolean)
  if (rawParts.length === 1) return rawParts

  const result = new Set<string>(rawParts)
  for (const multi of rawParts) {
    if (!multi.includes(' ')) continue
    for (const single of rawParts) {
      if (single.includes(' ') || single === multi) continue
      const lastSpace = multi.lastIndexOf(' ')
      result.add(multi.slice(0, lastSpace + 1) + single)
    }
  }
  return Array.from(result)
}

function detectArticle(normStr: string): { article: string; stem: string } | null {
  if (normStr.startsWith("l'")) {
    return { article: "l'", stem: normStr.slice(2) }
  }
  for (const art of ['une', 'un', 'les', 'des', 'la', 'le']) {
    if (normStr.startsWith(art + ' ')) {
      return { article: art, stem: normStr.slice(art.length + 1) }
    }
  }
  return null
}

// Return all article substitutions in the same gender group.
// un/le/l' are masculine; une/la/l' are feminine; les/des are plural.
// l' is resolved to a group via the gender marker; without one, all singular articles are accepted.
function articleVariants(normCanonical: string, gender: Gender): string[] {
  const detected = detectArticle(normCanonical)
  if (!detected) return []

  const { article, stem } = detected
  let group: string[]

  if (article === 'un' || article === 'le') {
    group = ['un', 'le', "l'"]
  } else if (article === 'une' || article === 'la') {
    group = ['une', 'la', "l'"]
  } else if (article === "l'") {
    if (gender === 'm') group = ['un', 'le', "l'"]
    else if (gender === 'f') group = ['une', 'la', "l'"]
    else group = ['un', 'une', 'le', 'la', "l'"]
  } else if (article === 'les' || article === 'des') {
    group = ['les', 'des']
  } else {
    return []
  }

  return group.map(a => (a === "l'" ? a + stem : a + ' ' + stem))
}

function generateVariants(canonical: string, gender: Gender): Set<string> {
  const variants = new Set<string>()
  const normCanonical = normaliseStr(canonical)

  for (const slashPart of splitSlash(canonical)) {
    for (const part of slashPart.split(',').map(p => p.trim()).filter(Boolean)) {
      for (const exp of expandE(part)) {
        const normExp = normaliseStr(exp)
        variants.add(normExp)
        for (const av of articleVariants(normExp, gender)) {
          variants.add(normaliseStr(av))
        }
      }

      for (const pv of optionalParenVariants(part)) {
        const normPv = normaliseStr(pv)
        variants.add(normPv)
        for (const av of articleVariants(normPv, gender)) {
          variants.add(normaliseStr(av))
        }
      }
    }
  }

  variants.delete(normCanonical)
  return variants
}

export function checkAnswer(userInput: string, expected: string): MatchResult {
  const { gender, stripped: canonical } = extractGender(expected)
  const { stripped: userStripped } = extractGender(userInput)

  const normUser = normaliseStr(userStripped)
  const normCanonical = normaliseStr(canonical)

  if (normUser === normCanonical) return { outcome: 'exact' }

  const variants = generateVariants(canonical, gender)
  if (variants.has(normUser)) {
    return { outcome: 'accepted', canonical }
  }

  return { outcome: 'incorrect' }
}
