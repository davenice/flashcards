# Flashcard Webapp — Implementation Plan

## Context
Building a client-side-only flashcard webapp for foreign language learning (French ↔ English). Deployed to GitHub Pages (static files, no server). User supplies a structured markdown file, picks a subset to study, then works through cards with correctness checking and a final summary with retest option.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Vite + React + TypeScript | Static output; right-sized for state complexity |
| Routing | React Router v7 `HashRouter` | GitHub Pages has no server rewrites; hash URLs work without config |
| Styling | Tailwind CSS v4 | Mobile-first utilities; single CSS import |
| Markdown parsing | Custom ~60-line parser | Exact format → typed output; no bundle weight |
| State | `useReducer` + React Context | Right-sized; no external library needed |
| Deployment | GitHub Actions + `deploy-pages` action | Automatic on push; no PAT required |

---

## Markdown Format

```markdown
# Theme 1: Les salutations

## Unit 1.1: Basics

### Section 1.1.1: Greetings

French | English
--- | ---
bonjour | hello
merci | thank you

### Section 1.1.2: Farewells

French | English
--- | ---
au revoir | goodbye
```

Rules:
- `#` = Theme, `##` = Unit, `###` = Section (standard Markdown headings — renders readably in any viewer)
- Each section begins with a header row (`French | English`) and a separator row (`--- | ---`) so the table renders correctly in Markdown viewers
- `word | translation` — card line; whitespace around `|` is stripped
- Blank lines and `//` comment lines are ignored
- Parser skips: the first `|`-line after a `###` heading (header row) and any line where both sides of `|` are only `-` characters (separator row)

---

## User Flow

1. **Home** — paste or upload a `.md` file → parsed in-browser → navigate to Setup
2. **Setup** — pick theme/unit/section via checkbox tree; choose direction (FR→EN or EN→FR)
3. **Session** — show prompt word → user types answer → check correctness → reveal result + correct answer if wrong → "Actually I was right" override button → advance
4. **Summary** — score (`n / total`), list of wrong answers, "Retest wrong answers" button

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
│   ├── sessionReducer.ts      # Actions: START_SESSION, SUBMIT_ANSWER, OVERRIDE_CORRECT, ADVANCE, RESET
│   ├── sessionReducer.test.ts
│   └── DeckContext.tsx        # Deck stored at App level, provided via Context
├── pages/
│   ├── HomePage.tsx           # Textarea paste + file upload
│   ├── SetupPage.tsx          # HierarchySelector + DirectionToggle + Start button
│   ├── SessionPage.tsx        # FlashCard + AnswerInput + FeedbackPanel + ProgressBar
│   └── SummaryPage.tsx        # Score + wrong answers list + retest
├── components/
│   ├── FlashCard.tsx          # Large centred prompt display
│   ├── AnswerInput.tsx        # Controlled input + submit; auto-focuses on mount
│   ├── FeedbackPanel.tsx      # Correct/incorrect + correct answer if wrong + override button
│   ├── ProgressBar.tsx        # Visual bar + "n / total" text
│   ├── HierarchySelector.tsx  # Checkbox tree; theme checkbox cascades to children
│   └── DirectionToggle.tsx    # FR→EN / EN→FR toggle
└── utils/
    ├── normalise.ts           # Trim, lowercase, collapse spaces (extension point for fuzzy matching)
    └── buildDeck.ts           # Filter by selection + direction → shuffled SessionCard[]
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
START_SESSION   → cards[], index=0, phase='answering'
SUBMIT_ANSWER   → normalise+compare, record result, phase='revealing'
OVERRIDE_CORRECT → mutate last result to 'overridden', stay in 'revealing'
ADVANCE         → index++; if index >= length → phase='complete'; else phase='answering'
RESET           → initial empty state
```

Correctness: `normalise(userAnswer) === normalise(card.answer)` where `normalise` = trim + lowercase + collapse spaces.

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
*          → redirect to /
```

---

## Vite Config

```typescript
// vite.config.ts
base: '/flashcards/'   // ← must match GitHub repo name
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
5. HomePage: paste + upload → parse → navigate to /setup
6. SetupPage: checkbox tree + direction toggle + `buildDeck` utility
7. SessionPage: full card flow with all components
8. SummaryPage: score display + wrong answers + retest
9. Polish: keyboard accessibility, mobile tap targets (44px min), ARIA labels
10. Deploy: GitHub Actions workflow, enable Pages, verify on mobile device

---

## Future Ideas (not in scope now)

- **End test early** - an option to end the test, show you your percentage score and give the opportunity to retest any you got wrong.
- **Progress persistence** — track results across sessions, first via `localStorage`, later optionally synced to an online store (e.g. a small backend or GitHub Gist)
- **Markdown file storage** — save uploaded/pasted decks in `localStorage` so the user doesn't have to re-upload each session; manage multiple saved decks
- **Celebratory feedback** — fun emoji or illustration on the summary screen based on score (à la Slack's "you're all caught up, here's a banana") — e.g. 100% gets a trophy, 80%+ gets a star, lower scores get an encouraging nudge
- **Fuzzy answer matching** — the `normalise.ts` utility is already the extension point:
  - `word1 / word2` in an answer → accept either
  - `word1, word2` in an answer → accept any one of the options
  - Strip leading articles (`le`, `la`, `les`, `un`, `une`) optionally
  - Ignore punctuation differences

---

## Verification Checklist

- `npm run build` exits 0, no TypeScript errors
- `npm run preview` — app serves from `localhost:4173/flashcards/` (matching base path)
- Hash routing: refreshing `/#/setup` does not 404
- Parser tests pass: `npx vitest run`
- Full session: paste example markdown → pick section → run session → reach summary
- File upload: `.md` file upload works same as paste
- Override: marking wrong answer as "actually correct" updates the score
- Retest: only wrong-answer cards appear in retest session
- Mobile: all tap targets reachable; keyboard doesn't obscure answer input
- GitHub Actions: workflow green, deployed URL works
