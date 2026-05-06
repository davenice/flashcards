# Flashcard Webapp — Implementation Plan

## Context
Building a client-side-only flashcard webapp for foreign language learning (French ↔ English). Deployed to GitHub Pages (static files, no server). User uploads a structured markdown file (saved to `localStorage`), picks a deck and subset to study, then works through cards with correctness checking and a final summary with retest option.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Vite + React + TypeScript | Static output; right-sized for state complexity |
| Routing | React Router v7 `HashRouter` | GitHub Pages has no server rewrites; hash URLs work without config |
| Styling | Tailwind CSS v4 | Mobile-first utilities; single CSS import |
| Markdown parsing | Custom ~60-line parser | Exact format → typed output; no bundle weight |
| State | `useReducer` + React Context | Right-sized; no external library needed |
| Persistence | `localStorage` | Decks survive page refresh; no server required |
| Deployment | GitHub Actions + `deploy-pages` action | Automatic on push; no PAT required |

---

## Markdown Format

```markdown
# Theme 1: Les salutations

## Unit 1.1: Basics

### Section 1.1.1: Greetings
| French | English |
|--------|---------|
| bonjour | hello |
| merci | thank you |

### Section 1.1.2: Farewells
| French | English |
|--------|---------|
| au revoir | goodbye |
```

Rules:
- `#` = Theme, `##` = Unit, `###` = Section (standard Markdown headings — renders readably in any viewer)
- Each section uses a GitHub-style pipe table: header row (`| French | English |`) immediately follows the `###` heading, then a separator row (`|--------|---------|`), then card rows
- Both `| word | translation |` (with surrounding pipes) and `word | translation` (without) are accepted; whitespace around `|` is stripped
- Blank lines and `//` comment lines are ignored
- Parser skips: the first `|`-line after a `###` heading (header row) and any line where every column contains only `-` characters (separator row)

---

## User Flow

1. **Home** — shows saved deck library; upload a `.md` file to add a deck → parsed and persisted → navigate to Setup; "View stats →" link appears once any session history exists
2. **Setup** — pick theme/unit/section via checkbox tree; choose direction (FR→EN or EN→FR); choose how many questions
3. **Session** — show prompt word → user types answer → check correctness → reveal result + correct answer if wrong → "Actually I was right" override button → advance; "End test" button available throughout
4. **Summary** — score (`n / total`; notes if ended early), list of wrong answers, "Retest wrong answers" button; results persisted to localStorage on mount
5. **Stats** — all-time correct/incorrect counts per card, sorted by most missed; total cards seen + attempts summary

---

## File Structure

```
src/
├── main.tsx
├── App.tsx                    # HashRouter + routes + Context providers
├── types.ts                   # All shared interfaces (define first)
├── parser/
│   ├── parseMarkdown.ts       # Single-pass line scanner; returns discriminated union
│   └── parseMarkdown.test.ts
├── state/
│   ├── sessionReducer.ts      # Actions: START_SESSION, SUBMIT_ANSWER, OVERRIDE_CORRECT, ADVANCE, END_EARLY, RESET
│   ├── sessionReducer.test.ts
│   └── DeckContext.tsx        # savedDecks + active deck; addDeck / selectDeck / removeDeck
├── pages/
│   ├── HomePage.tsx           # Saved deck library + file upload + stats link
│   ├── SetupPage.tsx          # HierarchySelector + DirectionToggle + question count + Start button
│   ├── SessionPage.tsx        # FlashCard + AnswerInput + FeedbackPanel + ProgressBar + End test
│   ├── SummaryPage.tsx        # Score + early-end note + wrong answers list + retest; persists results
│   └── StatsPage.tsx          # All-time per-card history; sorted by most missed
├── components/
│   ├── FlashCard.tsx          # Large centred prompt display
│   ├── AnswerInput.tsx        # Controlled input + submit; auto-focuses on mount
│   ├── FeedbackPanel.tsx      # Correct/incorrect + correct answer if wrong + override button
│   ├── ProgressBar.tsx        # Visual bar + "n / total" text
│   ├── HierarchySelector.tsx  # Checkbox tree; theme checkbox cascades to children
│   └── DirectionToggle.tsx    # FR→EN / EN→FR toggle
└── utils/
    ├── normalise.ts           # Trim, lowercase, collapse spaces (extension point for fuzzy matching)
    ├── buildDeck.ts           # Filter by selection + direction + optional limit → shuffled SessionCard[]
    ├── deckStorage.ts         # djb2 hash, localStorage load/persist for SavedDeck[]
    └── resultStorage.ts       # localStorage load/merge/check for CardStats[]; key: flashcards:results
.github/workflows/deploy.yml
vite.config.ts                 # base: '/flashcards/' — must match repo name on GitHub Pages
```

---

## Key Types (`src/types.ts`)

```typescript
interface Card { french: string; english: string; sectionPath: [string, string, string]; }
interface Section { name: string; cards: Card[]; }
interface Unit { name: string; sections: Section[]; }
interface Theme { name: string; units: Unit[]; }
interface Deck { themes: Theme[]; allCards: Card[]; }

interface SavedDeck { id: string; label: string; raw: string; savedAt: number; cardCount: number; }
// id = djb2 hash of raw content; label = first # heading or filename; raw = original markdown

interface CardStats { french: string; english: string; correct: number; incorrect: number; lastSeen: number; }
// key in storage: `${french}|||${english}` — direction-agnostic; overridden counts as correct

type Direction = 'fr-to-en' | 'en-to-fr';
interface SessionCard { card: Card; prompt: string; answer: string; }
type AnswerResult = 'correct' | 'incorrect' | 'overridden';
interface SessionCardResult { sessionCard: SessionCard; userAnswer: string; result: AnswerResult; }

type SessionPhase = 'answering' | 'revealing' | 'complete';
interface SessionState { cards: SessionCard[]; currentIndex: number; phase: SessionPhase; lastUserAnswer: string; results: SessionCardResult[]; }
```

---

## Session Reducer Transitions

```
START_SESSION    → cards[], index=0, phase='answering'
SUBMIT_ANSWER    → normalise+compare, record result, phase='revealing'
OVERRIDE_CORRECT → mutate last result to 'overridden', stay in 'revealing'
ADVANCE          → index++; if index >= length → phase='complete'; else phase='answering'
END_EARLY        → phase='complete' (results contains only answered cards)
RESET            → initial empty state
```

Correctness: `normalise(userAnswer) === normalise(card.answer)` where `normalise` = trim + lowercase + collapse spaces.

---

## Deck Persistence

- Decks stored in `localStorage` under key `flashcards:decks` as a JSON array of `SavedDeck`.
- Content is hashed (djb2) on upload; duplicate files are detected and silently reuse the existing entry.
- Label is extracted from the first `# heading` in the file; falls back to the filename without extension.
- Active deck is re-parsed from `SavedDeck.raw` on selection (parsed `Deck` is not stored).
- `QuotaExceededError` is caught in `persistDecks` and surfaced as a user-visible error message.

---

## Parser Design

Single-pass line scanner (no external library):
- `/^#\s+(.+)/` → new Theme
- `/^##\s+(.+)/` → new Unit under current Theme
- `/^###\s+(.+)/` → new Section under current Unit
- Line contains `|` → split on first `|`, trim, push Card into current Section
- Otherwise → skip

Returns `{ ok: true, deck: Deck } | { ok: false, error: string }` — discriminated union forces caller to handle errors.

---

## Routing (`HashRouter`)

```
/          → HomePage
/setup     → SetupPage   (redirects to / if no deck)
/session   → SessionPage (redirects to /setup if no session)
/summary   → SummaryPage (redirects to / if no results)
/stats     → StatsPage
*          → redirect to /
```

---

## Vite Config

```typescript
// vite.config.ts
base: '/'
```

---

## GitHub Actions Deployment

```yaml
# .github/workflows/deploy.yml
on: push to main
steps: checkout → setup-node 24 → npm ci → npm run build → upload-pages-artifact (dist/) → deploy-pages
permissions: contents:read, pages:write, id-token:write
environment: github-pages
```

GitHub repo Settings → Pages → Source: "GitHub Actions"

---

## Implementation Order

1. Scaffold: `npm create vite@latest . -- --template react-ts`, install deps, configure Tailwind + base path
2. Types + Parser: `src/types.ts`, `src/parser/parseMarkdown.ts`, parser tests
3. Routing skeleton: `App.tsx` with `HashRouter`, stub pages, `DeckContext`
4. Session reducer: full action union + tests
5. HomePage: file upload → parse → navigate to /setup
6. SetupPage: checkbox tree + direction toggle + `buildDeck` utility
7. SessionPage: full card flow with all components
8. SummaryPage: score display + wrong answers + retest
9. Polish: keyboard accessibility, mobile tap targets (44px min), ARIA labels
10. Deploy: GitHub Actions workflow, enable Pages, verify on mobile device
11. Question count: optional limit in `buildDeck`; stepper UI in SetupPage
12. End test early: `END_EARLY` reducer action; "End test" button in SessionPage; early-end note in SummaryPage
13. Deck persistence: `SavedDeck` type + `deckStorage.ts` + expanded `DeckContext`; HomePage becomes deck library
14. Results history: `CardStats` type + `resultStorage.ts`; SummaryPage persists on mount; StatsPage at `/stats`

---

## Future Ideas (not in scope now)

- **PWA support** — service worker + web app manifest; makes the app installable and usable offline. Pairs well with deck and results persistence already in place.
- **Results sync** — export/import results history (e.g. via GitHub Gist or JSON file download) to share across devices
- **Celebratory feedback** — fun emoji or illustration on the summary screen based on score (à la Slack's "you're all caught up, here's a banana") — e.g. 100% gets a trophy, 80%+ gets a star, lower scores get an encouraging nudge
- **Fuzzy answer matching** — the `normalise.ts` utility is already the extension point:
  - `word1 / word2` in an answer → accept either
  - `word1, word2` in an answer → accept any one of the options
  - Strip leading articles (`le`, `la`, `les`, `un`, `une`) optionally
  - Ignore punctuation differences
- **Accent buttons** — buttons to insert accented characters into the answer input

---

## Verification Checklist

- `npm run build` exits 0, no TypeScript errors
- `npm run preview` — app serves from `localhost:4173/` (matching base path)
- Hash routing: refreshing `/#/setup` does not 404
- Parser tests pass: `npx vitest run`
- Full session: upload a `.md` file → pick section → run session → reach summary
- Override: marking wrong answer as "actually correct" updates the score
- Retest: only wrong-answer cards appear in retest session
- Deck persistence: uploaded deck survives page refresh; appears in library on home page
- Duplicate detection: uploading the same file twice does not create two library entries
- Remove deck: deck disappears from library and is gone after refresh
- Question count: setting a limit produces a session with exactly that many cards
- End early: "End test" navigates to summary; score reflects only answered cards; "Ended after X of Y" note shown
- Results history: complete a session → summary → home → "View stats →" link visible
- Stats page: cards listed sorted by most missed; counts accumulate across sessions
- Stats page: empty state shown before first session; back link returns to home
- Mobile: all tap targets reachable; keyboard doesn't obscure answer input
- GitHub Actions: workflow green, deployed URL works
