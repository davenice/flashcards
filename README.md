# Flashcard Webapp

Client-side flashcard app for foreign language learning (French ↔ English). No server — everything runs in the browser and persists to `localStorage`. Installable as a PWA.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Vite + React + TypeScript |
| Routing | React Router v7 `HashRouter` |
| Styling | Tailwind CSS v4 |
| Markdown parsing | Custom ~60-line parser |
| State | `useReducer` + React Context |
| Persistence | `localStorage` |
| PWA | `vite-plugin-pwa` (Workbox, generateSW mode) |
| Deployment | GitHub Actions + `deploy-pages` action |

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
- `#` = Theme, `##` = Unit, `###` = Section
- Each section uses a pipe table; header and separator rows are skipped automatically
- Both `| word | translation |` and `word | translation` are accepted; whitespace around `|` is stripped
- Blank lines and `//` comment lines are ignored

---

## User Flow

1. **Home** — saved deck library; upload a `.md` file to add a deck; "View stats →" link once any session history exists
2. **Setup** — pick theme/unit/section via checkbox tree; choose direction (FR→EN or EN→FR); choose how many questions
3. **Session** — show prompt → user types answer → check correctness → reveal result + correct answer if wrong → "Actually I was right" override → advance; "End test" button throughout
4. **Summary** — score, early-end note if applicable, wrong answers list, "Retest wrong answers"; results persisted to `localStorage`
5. **Stats** — all-time correct/incorrect counts per card, sorted by most missed

---

## File Structure

```
src/
├── main.tsx
├── App.tsx                    # HashRouter + routes + Context providers + UpdatePrompt
├── types.ts
├── parser/
│   ├── parseMarkdown.ts
│   └── parseMarkdown.test.ts
├── state/
│   ├── sessionReducer.ts      # START_SESSION, SUBMIT_ANSWER, OVERRIDE_CORRECT, ADVANCE, END_EARLY, RESET
│   ├── sessionReducer.test.ts
│   └── DeckContext.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── SetupPage.tsx
│   ├── SessionPage.tsx
│   ├── SummaryPage.tsx
│   └── StatsPage.tsx
├── components/
│   ├── FlashCard.tsx
│   ├── AnswerInput.tsx
│   ├── FeedbackPanel.tsx
│   ├── ProgressBar.tsx
│   ├── HierarchySelector.tsx
│   ├── DirectionToggle.tsx
│   └── UpdatePrompt.tsx       # SW update banner (vite-plugin-pwa useRegisterSW)
└── utils/
    ├── normalise.ts
    ├── buildDeck.ts
    ├── deckStorage.ts         # djb2 hash, localStorage; key: flashcards:decks
    └── resultStorage.ts       # localStorage; key: flashcards:results
public/
├── favicon.svg                # Browser tab icon (detailed, with filters)
├── icon.svg                   # Source for PWA icons (clean, square, purple bg)
├── icon-192.png               # PWA icon
├── icon-512.png               # PWA icon (also used as maskable)
└── icons.svg
.github/workflows/deploy.yml
vite.config.ts                 # base: '/'
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
// id = djb2 hash of raw; label = first # heading or filename

interface CardStats { french: string; english: string; correct: number; incorrect: number; lastSeen: number; }
// key: `${french}|||${english}` — direction-agnostic; overridden counts as correct

type Direction = 'fr-to-en' | 'en-to-fr';
interface SessionCard { card: Card; prompt: string; answer: string; }
type AnswerResult = 'correct' | 'incorrect' | 'overridden';
interface SessionCardResult { sessionCard: SessionCard; userAnswer: string; result: AnswerResult; }

type SessionPhase = 'answering' | 'revealing' | 'complete';
interface SessionState { cards: SessionCard[]; currentIndex: number; phase: SessionPhase; lastUserAnswer: string; results: SessionCardResult[]; }
```

---

## PWA

Built with `vite-plugin-pwa` in `generateSW` mode (Workbox). At build time, Workbox precaches all static assets — the app works fully offline after first load.

- **Manifest** — `display: standalone`, `theme_color: #863bff`, `start_url: /`
- **Service worker** — cache-first for all precached assets; update detected in background
- **Update flow** — `UpdatePrompt` component shows a "New version available / Reload" banner when a new SW is waiting
- **iOS** — `apple-mobile-web-app-capable`, `apple-touch-icon` set in `index.html`
- **Icons** — regenerate from `public/icon.svg` if needed:
  ```bash
  magick public/icon.svg -background none -resize 192x192 public/icon-192.png
  magick public/icon.svg -background none -resize 512x512 public/icon-512.png
  ```

---

## Session Reducer Transitions

```
START_SESSION    → cards[], index=0, phase='answering'
SUBMIT_ANSWER    → normalise+compare, record result, phase='revealing'
OVERRIDE_CORRECT → mutate last result to 'overridden', stay in 'revealing'
ADVANCE          → index++; if index >= length → phase='complete'; else phase='answering'
END_EARLY        → phase='complete'
RESET            → initial empty state
```

Correctness: `checkAnswer(userAnswer, card.answer)` — see `src/utils/checkAnswer.ts`. Handles gender marker stripping, optional feminine suffixes `(e)`/`(es)`, article interchangeability (`le`/`un`/`l'`), optional parenthetical words, and slash alternation. Returns `exact | accepted | incorrect`; `accepted` carries the canonical form shown as a hint.

---

## Deployment

GitHub Actions on push to `main`: checkout → `npm ci` → `npm run build` → upload `dist/` → deploy to GitHub Pages (custom domain: flashcards.dandr.org).

---

## Future Ideas

- **Results sync** — export/import results history (JSON file download) to share across devices
- **Celebratory feedback** — emoji or illustration on summary based on score
