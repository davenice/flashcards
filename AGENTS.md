# Agent orientation

French ↔ English flashcard PWA. No backend — everything runs in the browser with `localStorage` persistence.

## Documentation

Bugs are tracked in BUGS.md
Features are in README.md

## Stack

- **React 19 + TypeScript + Vite** — standard CRA-style setup
- **Tailwind CSS v4** — utility classes only, no custom CSS beyond `index.css`
- **React Router v7 `HashRouter`** — hash-based routing for GitHub Pages compatibility
- **`useReducer` + React Context** — all session state lives in `sessionReducer.ts`; deck/result data in `DeckContext.tsx`
- **`vite-plugin-pwa`** (Workbox, `generateSW`) — precaches all assets for offline use

## Key files

```
src/
├── App.tsx                    # Routes, context providers, SW update banner
├── types.ts                   # All shared interfaces (Card, Deck, SessionState, etc.)
├── parser/parseMarkdown.ts    # ~60-line parser: # Theme / ## Unit / ### Section / pipe tables
├── state/
│   ├── sessionReducer.ts      # START_SESSION | SUBMIT_ANSWER | OVERRIDE_CORRECT | ADVANCE | END_EARLY | RESET
│   └── DeckContext.tsx        # Saved decks + session state; reads/writes localStorage
├── pages/                     # One file per route: Home Setup Session Summary Stats
├── components/
│   ├── AnswerInput.tsx         # Text input + accent buttons (é è ê ë à â ä æ î ï ô ö œ ù û ü ç)
│   ├── FeedbackPanel.tsx       # Shows result; "Actually I was right" override button
│   └── HierarchySelector.tsx  # Checkbox tree for theme/unit/section selection
└── utils/
    ├── checkAnswer.ts          # Answer validation (see below)
    ├── buildDeck.ts            # Filters Card[] into SessionCard[] by selection + direction
    ├── deckStorage.ts          # localStorage key: flashcards:decks; id = djb2 hash of raw markdown
    └── resultStorage.ts        # localStorage key: flashcards:results; keyed by `french|||english`
```

## Answer validation (`checkAnswer.ts`)

`checkAnswer(userInput, expected): MatchResult` returns `exact | accepted | incorrect`.

It handles French-specific patterns before comparing:

| Feature | Example |
|---|---|
| Gender markers stripped | `chaud (m)` → compares `chaud` |
| Optional feminine suffix | `mort(e)` → accepts `mort` or `morte` |
| Article interchangeability | `le/un/l'` accepted for any masculine noun |
| Optional parenthetical words | `la (pension de) retraite` → both forms accepted |
| Slash alternation | `à temps plein/complet` → accepts either full phrase |

If a user answer matches a non-canonical variant the result is `accepted` and the canonical form is shown as a hint.

## Session flow

```
START_SESSION → phase='answering'
SUBMIT_ANSWER → checkAnswer() → record result → phase='revealing'
OVERRIDE_CORRECT → mutate last result to 'overridden'
ADVANCE → phase='answering' (or 'complete' if last card)
END_EARLY → phase='complete'
```

`complete` triggers navigation to `/summary` in `SessionPage`.

## Conventions

- Components are function components, props typed with inline `interface Props`
- No global CSS; Tailwind only
- Min touch target `min-h-[44px]` on interactive elements
- `autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}` on all answer inputs
- Tests colocated with source (`*.test.ts`), run with Vitest
- `HashRouter` means routes are `/#/setup`, `/#/session` etc. — no server config needed
