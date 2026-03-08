# CLAUDE.md — Flip7 Multiplayer

This file documents the codebase for AI assistants (Claude, etc.) to understand the project structure, conventions, and development workflows.

---

## Project Overview

**Flip7 Multiplayer** is a real-time multiplayer card game built with Next.js and Socket.IO. Players join game rooms, take turns drawing cards, and try to accumulate the highest score without busting. The game supports multiple simultaneous rooms, special cards, sound effects, and a full scoring system.

- **Frontend:** Next.js 13 App Router + React 18 + TypeScript
- **UI:** shadcn/ui components + Tailwind CSS
- **Real-time backend:** Socket.IO server (Node.js, separate process)
- **State:** In-memory only (no database)

---

## Repository Structure

```
flip7-multiplayer/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout (metadata, font, providers)
│   ├── page.tsx              # Home page — renders GameLobby
│   └── globals.css           # Global Tailwind styles + CSS variables
├── components/
│   ├── game-board.tsx        # Main game UI (draw, stop, special cards, scoreboard)
│   ├── game-lobby.tsx        # Create/join game room UI
│   ├── playing-card.tsx      # Card display with color coding
│   ├── BuyMeACoffeeButton.tsx# Sponsor/donation button
│   └── ui/                   # shadcn/ui component library (35+ components)
│       └── gamerInfo.tsx     # Player info card (score, hand, status)
├── hooks/
│   ├── use-socket.ts         # All WebSocket logic + game state (critical file)
│   └── use-toast.ts          # Toast notification hook
├── lib/
│   ├── types.ts              # Core TypeScript interfaces (Card, Player, GameState)
│   └── utils.ts             # Utility: cn() for className merging
├── server/
│   └── socket.ts             # Socket.IO game server — all game logic (419 lines)
├── utils/
│   └── soundMappings.ts      # Audio event → file path mappings
├── public/
│   └── sounds/               # Sound effect files (.mp3/.wav)
├── next.config.js            # Next.js config (static export, image opt disabled)
├── tailwind.config.ts        # Tailwind theme (HSL CSS variables, dark mode)
├── tsconfig.json             # TypeScript (strict, path alias @/* → ./)
├── components.json           # shadcn/ui config
└── package.json              # Scripts, dependencies
```

---

## Development Workflows

### Running the Project

The project requires **two separate processes** to run together:

```bash
# Terminal 1 — Next.js frontend (port 3000)
npm run dev

# Terminal 2 — Socket.IO backend (port 3001)
npm run socket
```

Both must be running for the game to work. The frontend connects to the socket server at the URL defined by `NEXT_PUBLIC_SOCKET_URL` (default: `http://localhost:3001`).

### Other Scripts

```bash
npm run build    # Build Next.js for production (static export)
npm run start    # Serve production build
npm run lint     # Run ESLint (next/core-web-vitals)
```

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | Frontend WebSocket server URL |
| `BACKEND_PORT` | `3001` | Socket.IO server port |

Create a `.env.local` file for local overrides (this file is gitignored).

---

## Architecture

### Frontend

- **Next.js App Router** with `"use client"` directives on interactive components.
- **No server-side data fetching** — all game state comes through WebSocket events.
- **`hooks/use-socket.ts`** is the central hub: it creates the socket connection, maintains all game state via `useState`, and exposes action functions (`createGame`, `joinGame`, `drawCard`, etc.) to components.
- Components receive state and handlers as props from `use-socket`.

### Backend (`server/socket.ts`)

- Pure Socket.IO server, no HTTP routes.
- All game rooms stored in an in-memory `Map<gameId, GameState>`.
- **No persistence** — restarting the server clears all games.
- Helper functions encapsulate game logic:
  - `generateDeck()` — creates and shuffles the 118-card deck
  - `handleDrawNumberCard()` — processes number card draws (bust detection)
  - `handlePlaySpecialCard()` — applies freeze/flip-three/second-chance effects
  - `handleScoreCards()` — calculates round scores (modifiers, Flip7 bonus)
  - `getNextPlayerIndex()` — handles turn rotation and direction

### State Flow

```
User Action → Component → useSocket hook → socket.emit()
                                                ↓
                                        Server handles event
                                                ↓
                                        socket.to(gameId).emit('gameStateUpdated')
                                                ↓
                                        useSocket updates React state
                                                ↓
                                        Components re-render
```

---

## Core Data Types (`lib/types.ts`)

```typescript
interface Card {
  value: "freeze" | "flip three" | "second chance" | "x2" | "+2" | "+4" | "+6" | "+8" | "+10" | string;
  type: "number" | "special" | "modifier";
}

interface Player {
  id: string;
  name: string;
  cards: Card[];
  lastDrawnCard: Card | null;
  status: "start" | "dealing" | "stop";
  secondChance: boolean;
  score: number;
}

interface GameState {
  id: string;
  round: number;
  players: Player[];
  currentPlayer: number;  // index into players array
  deck: Card[];
  discardPile: Card[];
  direction: number;      // 1 = clockwise, -1 = counter-clockwise
  flipCount: number;
  status: "waiting" | "ready" | "playing" | "stopped" | "finished";
}
```

---

## WebSocket Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `createGame` | `playerName: string` | Create a new game room |
| `joinGame` | `{ gameId, playerName }` | Join an existing room by code |
| `startGame` | `gameId: string` | Host starts the game |
| `drawCard` | `gameId: string, callback` | Draw a card (callback returns drawn card) |
| `stopDrawCard` | `gameId: string` | Stop drawing, finalize score |
| `playCard` | `{ gameId, victimId, playedCard }` | Play a special card on a target player |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `gameCreated` | `{ gameId, gameState }` | Confirms game creation |
| `playerJoined` | `{ gameState }` | Broadcast when someone joins |
| `gameStarted` | `{ gameState }` | Broadcast when game begins |
| `gameStateUpdated` | `{ gameState }` | Broadcast after any state change |
| `gameOver` | `{ winner }` | Game finished, announces winner |
| `error` | `message: string` | Error from server |

---

## Game Rules Reference

### Deck Composition (118 cards)
- **Number cards:** 0 (×1), 1 (×1), 2 (×2), ..., 12 (×12)
- **Modifier cards:** x2, +2, +4, +6, +8, +10 (×1 each)
- **Special cards:** freeze, flip three, second chance (×3 each)

### Gameplay
- Players take turns drawing cards.
- Drawing a **duplicate number** = bust (lose accumulated cards for the round).
- **Second Chance** card saves a player from one bust.
- **Flip7** = collecting 7 different number cards = +15 bonus and auto-stop.
- Win condition: reach 200 points.

### Special Cards
| Card | Effect |
|---|---|
| Freeze | Target player is frozen; their current score is locked in |
| Flip Three | Target player must draw 3 additional cards |
| Second Chance | Saves the holder from their next bust |

### Scoring
- Number cards: face value
- `+X` modifiers: add X to score
- `x2` modifier: doubles total score
- Flip7 bonus: +15 points

---

## UI Conventions

### Styling
- **Tailwind CSS** utility classes only — no custom CSS except in `globals.css`.
- **CSS variables** for theming (defined in `globals.css`, e.g., `--primary`, `--background`).
- **Dark mode** is class-based (`dark:` prefix). The default theme appears dark.
- Use `cn()` from `lib/utils.ts` for conditional className merging.

### Components
- All interactive components must have `"use client"` at the top.
- UI primitives live in `components/ui/` (shadcn/ui generated — avoid editing directly).
- Custom game components live in `components/` root.
- Props should be typed with explicit TypeScript interfaces, not `any`.

### shadcn/ui
- Components are generated via `npx shadcn-ui@latest add <component>`.
- Config is in `components.json`. Style: `default`. CSS variables: enabled.
- Import from `@/components/ui/<component>`.

---

## Key Conventions

### TypeScript
- Strict mode is enabled — no implicit `any`.
- Path alias `@/` resolves to the project root (e.g., `@/lib/types`).
- All types for game domain logic must be defined in `lib/types.ts`.

### File Organization
- **Game logic** belongs in `server/socket.ts`, not in frontend hooks/components.
- **WebSocket event handling** belongs in `hooks/use-socket.ts`.
- **Rendering logic** belongs in components.
- **Shared types** belong in `lib/types.ts`.

### No Tests
There is currently no test infrastructure. When adding tests, prefer **Vitest** (compatible with the Vite/Next.js ecosystem) and place test files alongside source files as `*.test.ts` or `*.test.tsx`.

### Sounds
- Sound effect mappings are in `utils/soundMappings.ts`.
- Audio files live in `public/sounds/`.
- Sounds are played from within `components/game-board.tsx` in response to game events.

---

## Common Tasks

### Add a new special card
1. Add the card value to the `Card` type in `lib/types.ts`.
2. Add it to `generateDeck()` in `server/socket.ts`.
3. Add handling in `handlePlaySpecialCard()` in `server/socket.ts`.
4. Add a sound mapping in `utils/soundMappings.ts` if needed.
5. Add card color/display logic in `components/playing-card.tsx`.

### Add a new WebSocket event
1. Add the `socket.on(...)` handler in `server/socket.ts`.
2. Add the `socket.on(...)` listener in `hooks/use-socket.ts`.
3. Expose a trigger function from `use-socket.ts` to components.

### Add a new UI component
1. Check if shadcn/ui has the component: `npx shadcn-ui@latest add <name>`.
2. If custom, create it in `components/`.
3. Use `cn()` for class merging, Tailwind for all styles.

---

## Known Constraints & Gotchas

- **Static export:** `next.config.js` sets `output: 'export'`. This means no Next.js API routes (`/api/*`) or server-side rendering. The backend is entirely the Socket.IO server.
- **In-memory only:** Restarting `npm run socket` clears all active game rooms.
- **Single deck per game:** There is no deck shuffle between rounds — the deck state persists. Verify this behavior before implementing multi-round games.
- **ESLint skipped in builds:** `ignoreDuringBuilds: true` is set. Linting is manual (`npm run lint`).
- **Port conflicts:** If port 3001 is in use, set `BACKEND_PORT` to another value and update `NEXT_PUBLIC_SOCKET_URL` accordingly.
