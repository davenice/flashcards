import { describe, it, expect } from 'vitest'
import { checkAnswer } from './checkAnswer'

describe('checkAnswer', () => {
  // ─── Exact match ─────────────────────────────────────────────────────────────

  describe('exact match', () => {
    it('returns exact for identical input', () => {
      expect(checkAnswer('bonjour', 'bonjour')).toEqual({ outcome: 'exact' })
    })

    it('is case-insensitive', () => {
      expect(checkAnswer('Bonjour', 'bonjour')).toEqual({ outcome: 'exact' })
    })

    it('ignores leading and trailing whitespace', () => {
      expect(checkAnswer('  bonjour  ', 'bonjour')).toEqual({ outcome: 'exact' })
    })

    it('collapses internal whitespace', () => {
      expect(checkAnswer('au  revoir', 'au revoir')).toEqual({ outcome: 'exact' })
    })
  })

  // ─── Rule 0: gender marker stripping ─────────────────────────────────────────

  describe('gender marker stripping', () => {
    it("exact match ignoring trailing (f) marker", () => {
      expect(checkAnswer("l'aide", "l'aide (f)")).toEqual({ outcome: 'exact' })
    })

    it("exact match ignoring trailing (m) marker", () => {
      expect(checkAnswer("l'adultère", "l'adultère (m)")).toEqual({ outcome: 'exact' })
    })

    it('exact match ignoring trailing (m pl) marker', () => {
      expect(checkAnswer('les grands-parents maternels', 'les grands-parents maternels (m pl)')).toEqual({ outcome: 'exact' })
    })

    it('exact match ignoring trailing (f pl) marker', () => {
      expect(checkAnswer('les voix respiratoires', 'les voix respiratoires (f pl)')).toEqual({ outcome: 'exact' })
    })

    it('accepts the marker typed as part of the answer', () => {
      expect(checkAnswer("l'aide (f)", "l'aide (f)")).toEqual({ outcome: 'exact' })
    })

    it('exact match ignoring inline (f) marker', () => {
      expect(checkAnswer("l'ère informatique", "l'ère (f) informatique")).toEqual({ outcome: 'exact' })
    })
  })

  // ─── Rule 1: apostrophe normalisation ────────────────────────────────────────

  describe('apostrophe normalisation', () => {
    it('straight apostrophe matches stored curly apostrophe (exact)', () => {
      // stored form uses curly apostrophe (U+2019); user types straight (U+0027)
      expect(checkAnswer("l'aide", 'l’aide (f)')).toEqual({ outcome: 'exact' })
    })

    it('straight apostrophe matches stored curly apostrophe (accepted)', () => {
      expect(checkAnswer('une aide', 'l’aide (f)')).toEqual({
        outcome: 'accepted',
        canonical: 'l’aide',
      })
    })
  })

  // ─── Rule 3: slash alternatives ──────────────────────────────────────────────

  describe('slash alternatives', () => {
    it('accepts the first alternative', () => {
      expect(checkAnswer('à temps plein', 'à temps plein/complet')).toEqual({
        outcome: 'accepted',
        canonical: 'à temps plein/complet',
      })
    })

    it('accepts the second alternative', () => {
      expect(checkAnswer('à temps complet', 'à temps plein/complet')).toEqual({
        outcome: 'accepted',
        canonical: 'à temps plein/complet',
      })
    })

    it('handles spaces around the slash', () => {
      expect(checkAnswer('accoutumance', 'accoutumance/ dépendance')).toEqual({
        outcome: 'accepted',
        canonical: 'accoutumance/ dépendance',
      })
      expect(checkAnswer('dépendance', 'accoutumance/ dépendance')).toEqual({
        outcome: 'accepted',
        canonical: 'accoutumance/ dépendance',
      })
    })

    it('accepts either side of a multi-word slash alternative', () => {
      expect(checkAnswer('un réseau social', 'un réseau social/des réseaux sociaux')).toEqual({
        outcome: 'accepted',
        canonical: 'un réseau social/des réseaux sociaux',
      })
      expect(checkAnswer('des réseaux sociaux', 'un réseau social/des réseaux sociaux')).toEqual({
        outcome: 'accepted',
        canonical: 'un réseau social/des réseaux sociaux',
      })
    })

    it('rejects a partial match spanning the slash', () => {
      expect(checkAnswer('temps plein', 'à temps plein/complet')).toEqual({ outcome: 'incorrect' })
    })
  })

  // ─── Rule 4: comma alternatives ──────────────────────────────────────────────

  describe('comma alternatives', () => {
    it('accepts the first comma alternative', () => {
      expect(checkAnswer('la recherche sur internet', 'la recherche sur Internet, en ligne')).toEqual({
        outcome: 'accepted',
        canonical: 'la recherche sur Internet, en ligne',
      })
    })

    it('accepts the second comma alternative', () => {
      expect(checkAnswer('en ligne', 'la recherche sur Internet, en ligne')).toEqual({
        outcome: 'accepted',
        canonical: 'la recherche sur Internet, en ligne',
      })
    })
  })

  // ─── Rule 5: optional (e) / (es) endings ─────────────────────────────────────

  describe('optional (e) / (es) endings', () => {
    it('accepts the base form without e', () => {
      expect(checkAnswer('mort', 'mort(e)')).toEqual({ outcome: 'accepted', canonical: 'mort(e)' })
    })

    it('accepts the form with e appended', () => {
      expect(checkAnswer('morte', 'mort(e)')).toEqual({ outcome: 'accepted', canonical: 'mort(e)' })
    })

    it('accepts un from un(e)', () => {
      expect(checkAnswer('un bénévole', 'un(e) bénévole')).toEqual({
        outcome: 'accepted',
        canonical: 'un(e) bénévole',
      })
    })

    it('accepts une from un(e)', () => {
      expect(checkAnswer('une bénévole', 'un(e) bénévole')).toEqual({
        outcome: 'accepted',
        canonical: 'un(e) bénévole',
      })
    })

    it('accepts base form for (es) ending', () => {
      expect(checkAnswer('se faire des amis', 'se faire des amis(es)')).toEqual({
        outcome: 'accepted',
        canonical: 'se faire des amis(es)',
      })
    })

    it('accepts the es form for (es) ending', () => {
      expect(checkAnswer('se faire des amies', 'se faire des amis(es)')).toEqual({
        outcome: 'accepted',
        canonical: 'se faire des amis(es)',
      })
    })

    it('handles multiple (e) markers — all masculine forms', () => {
      expect(checkAnswer('un petit ami', 'un(e) petit(e) ami(e)')).toEqual({
        outcome: 'accepted',
        canonical: 'un(e) petit(e) ami(e)',
      })
    })

    it('handles multiple (e) markers — all feminine forms', () => {
      expect(checkAnswer('une petite amie', 'un(e) petit(e) ami(e)')).toEqual({
        outcome: 'accepted',
        canonical: 'un(e) petit(e) ami(e)',
      })
    })
  })

  // ─── Rule 6: article interchangeability ──────────────────────────────────────

  describe('article interchangeability', () => {
    describe('masculine (un / le / l\')', () => {
      it('accepts le for un', () => {
        expect(checkAnswer('le chien', 'un chien')).toEqual({
          outcome: 'accepted',
          canonical: 'un chien',
        })
      })

      it("accepts l' for un (vowel-initial noun)", () => {
        expect(checkAnswer("l'arbre", 'un arbre')).toEqual({
          outcome: 'accepted',
          canonical: 'un arbre',
        })
      })

      it('accepts un for le', () => {
        expect(checkAnswer('un chien', 'le chien')).toEqual({
          outcome: 'accepted',
          canonical: 'le chien',
        })
      })

      it('rejects la for un — wrong gender', () => {
        expect(checkAnswer('la chien', 'un chien')).toEqual({ outcome: 'incorrect' })
      })

      it('rejects une for un — wrong gender', () => {
        expect(checkAnswer('une chien', 'un chien')).toEqual({ outcome: 'incorrect' })
      })
    })

    describe("feminine (une / la / l')", () => {
      it('accepts la for une', () => {
        expect(checkAnswer('la pomme', 'une pomme')).toEqual({
          outcome: 'accepted',
          canonical: 'une pomme',
        })
      })

      it("accepts l' for une (vowel-initial noun)", () => {
        expect(checkAnswer("l'orange", 'une orange')).toEqual({
          outcome: 'accepted',
          canonical: 'une orange',
        })
      })

      it('accepts une for la', () => {
        expect(checkAnswer('une pomme', 'la pomme')).toEqual({
          outcome: 'accepted',
          canonical: 'la pomme',
        })
      })

      it('rejects le for une — wrong gender', () => {
        expect(checkAnswer('le pomme', 'une pomme')).toEqual({ outcome: 'incorrect' })
      })

      it('rejects un for une — wrong gender', () => {
        expect(checkAnswer('un pomme', 'une pomme')).toEqual({ outcome: 'incorrect' })
      })
    })

    describe('plural (les / des)', () => {
      it('accepts des for les', () => {
        expect(checkAnswer('des enfants', 'les enfants')).toEqual({
          outcome: 'accepted',
          canonical: 'les enfants',
        })
      })

      it('accepts les for des', () => {
        expect(checkAnswer('les données', 'des données')).toEqual({
          outcome: 'accepted',
          canonical: 'des données',
        })
      })
    })

    describe("l' resolved by gender marker", () => {
      it("accepts une for l' when (f) marker present", () => {
        expect(checkAnswer('une aide', "l'aide (f)")).toEqual({
          outcome: 'accepted',
          canonical: "l'aide",
        })
      })

      it("accepts la for l' when (f) marker present", () => {
        expect(checkAnswer('la aide', "l'aide (f)")).toEqual({
          outcome: 'accepted',
          canonical: "l'aide",
        })
      })

      it("rejects un for l' when (f) marker present — wrong gender", () => {
        expect(checkAnswer('un aide', "l'aide (f)")).toEqual({ outcome: 'incorrect' })
      })

      it("rejects le for l' when (f) marker present — wrong gender", () => {
        expect(checkAnswer('le aide', "l'aide (f)")).toEqual({ outcome: 'incorrect' })
      })

      it("accepts un for l' when (m) marker present", () => {
        expect(checkAnswer('un adultère', "l'adultère (m)")).toEqual({
          outcome: 'accepted',
          canonical: "l'adultère",
        })
      })

      it("accepts le for l' when (m) marker present", () => {
        expect(checkAnswer('le adultère', "l'adultère (m)")).toEqual({
          outcome: 'accepted',
          canonical: "l'adultère",
        })
      })

      it("rejects une for l' when (m) marker present — wrong gender", () => {
        expect(checkAnswer('une adultère', "l'adultère (m)")).toEqual({ outcome: 'incorrect' })
      })

      it("rejects la for l' when (m) marker present — wrong gender", () => {
        expect(checkAnswer('la adultère', "l'adultère (m)")).toEqual({ outcome: 'incorrect' })
      })

      it("accepts any singular article for l' with no gender marker", () => {
        const expected = "l'ordinateur"
        expect(checkAnswer('un ordinateur', expected)).toEqual({ outcome: 'accepted', canonical: "l'ordinateur" })
        expect(checkAnswer('une ordinateur', expected)).toEqual({ outcome: 'accepted', canonical: "l'ordinateur" })
        expect(checkAnswer('le ordinateur', expected)).toEqual({ outcome: 'accepted', canonical: "l'ordinateur" })
        expect(checkAnswer('la ordinateur', expected)).toEqual({ outcome: 'accepted', canonical: "l'ordinateur" })
      })
    })
  })

  // ─── Rule 7: optional parenthetical words ────────────────────────────────────

  describe('optional parenthetical words', () => {
    it('accepts the phrase without the optional content', () => {
      expect(checkAnswer('la retraite', 'la (pension de) retraite')).toEqual({
        outcome: 'accepted',
        canonical: 'la (pension de) retraite',
      })
    })

    it('accepts the phrase with the optional content included', () => {
      expect(checkAnswer('la pension de retraite', 'la (pension de) retraite')).toEqual({
        outcome: 'accepted',
        canonical: 'la (pension de) retraite',
      })
    })
  })

  // ─── Incorrect answers ────────────────────────────────────────────────────────

  describe('incorrect answers', () => {
    it('returns incorrect for a completely wrong answer', () => {
      expect(checkAnswer('bonjour', 'au revoir')).toEqual({ outcome: 'incorrect' })
    })

    it('returns incorrect for wrong gender article on a masculine noun', () => {
      expect(checkAnswer('la chien', 'un chien')).toEqual({ outcome: 'incorrect' })
    })

    it('returns incorrect for wrong gender article on a feminine noun', () => {
      expect(checkAnswer('le pomme', 'une pomme')).toEqual({ outcome: 'incorrect' })
    })

    it('returns incorrect for une when un is expected (no (e) marker)', () => {
      expect(checkAnswer('une bénévole', 'un bénévole')).toEqual({ outcome: 'incorrect' })
    })
  })
})
