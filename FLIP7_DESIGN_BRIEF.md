# Flip7 Multiplayer — Design Brief for Google Stitch

## Project Purpose

**Flip7 Multiplayer** is a real-time multiplayer card game playable directly in the browser, no installation required. The goal is to accumulate the highest score possible without "busting," while competing simultaneously with 2 to 6 players in the same room.

The game targets short, casual sessions (10–20 minutes), ideal for groups of friends playing from their phones or computers without needing an account or registration.

---

## Game Mechanics

### Basic flow
1. A player creates a room and shares the invite code.
2. Other players join using that code.
3. On each turn, the active player decides to **draw a card** or **stop**.
4. Drawing a duplicate number causes a **bust**: all cards accumulated in the round are lost.
5. At the end of each round, players who stopped in time score points.
6. The first player to reach **200 points** wins the game.

### Card types
| Type | Examples | Effect |
|------|----------|--------|
| **Number** | 0 through 12 | Adds face value to score |
| **Modifier** | +2, +4, +6, +8, +10, ×2 | Modifies the total score |
| **Special** | Freeze, Flip Three, Second Chance | Effects targeting players |

### Special cards
- **Freeze (❄️):** Freezes a target player; their current score is locked in.
- **Flip Three (🎴):** Forces a target player to draw 3 additional cards.
- **Second Chance (💖):** Saves the holder from one bust (activates automatically).
- **Flip7 (🌈):** Collecting all 7 unique number cards grants +15 bonus points and auto-stops the player.

---

## UI States

The interface has 5 distinct states, each with different visual requirements:

| State | Description | Main screen |
|-------|-------------|-------------|
| `waiting` | Room created, waiting for players | Player list + room code + rules |
| `ready` | All joined, host can start | "Start Game" button active |
| `playing` | Active turn | Player hand + Draw/Stop buttons + opponent hands |
| `stopped` | Round ended, scores tallied | Hands locked, scores visible |
| `finished` | Game over | Winner screen with final ranking |

---

## UI Structure (Key Components)

### Lobby (create/join)
- Player name input
- Toggle: "Create Room" / "Join Room"
- Room code input field
- Expandable "How to Play" section with game rules

### Game Board
1. **Top bar:** Current round, room code, invite button
2. **Active player's hand:** Current cards + score + turn indicator
3. **Opponent hands:** Card for each opponent showing hand and score
4. **Action area:** Draw button and Stop button
5. **Force Draw indicator:** Appears when Flip Three is active (pulsing orange)

### Modals / Overlays
- **Victim selection:** When playing a special card, an overlay appears to choose the target
- **Event notification:** Appears centered for 2.5s to announce busts, flip7, freeze, etc.
- **Victory screen:** Full-screen overlay with ranking and animated confetti

---

## Current Aesthetic (Redesign Reference)

### Current color palette
The game currently uses a **dark neon arcade theme:**

```
Main background:   hsl(220, 15%, 6%)    — Very dark blue-gray
Main text:         hsl(0, 0%, 95%)      — Near white
Card/surface:      hsl(220, 15%, 10%)   — Slightly lighter dark
Primary:           hsl(270, 100%, 70%)  — Bright neon purple
Accent:            hsl(270, 80%, 60%)   — Muted purple
Destructive:       hsl(0, 90%, 55%)     — Bright red
```

**Secondary neon colors in use:**
- Cyan (`#06B6D4`) — Draw button, freeze effects
- Pink (`#EC4899`) — Second Chance card
- Green (`#22C55E`) — Positive actions
- Yellow (`#EAB308`) — Modifiers, active score
- Orange (`#F97316`) — Flip Three
- Blue (`#3B82F6`) — UI highlights

### Card color system
Each number from 0 to 12 has a unique gradient and glow:
| Value | Color |
|-------|-------|
| 0 | Rose |
| 1 | Amber |
| 2 | Lime |
| 3 | Cyan |
| 4 | Indigo |
| 5 | Teal |
| 6 | Orange |
| 7 | Pink |
| 8 | Purple |
| 9 | Yellow |
| 10 | Green |
| 11 | Blue |
| 12 | Red |

---

## Visual Patterns to Consider in the Redesign

### Current effects
- **Glassmorphism:** Semi-transparent backgrounds + `backdrop-blur` on surfaces
- **Neon glow:** All interactive elements have colored `box-shadow`
- **Card gradients:** Each card has a unique diagonal gradient
- **Surface shine:** Diagonal white overlay simulating light reflection on cards
- **Ambient animations:** Neon pulse (2s infinite) on the active player

### Visual hierarchy (highest to lowest prominence)
1. Event notifications (z-50, centered, large)
2. Victim selection modal (z-40, dark overlay)
3. Victory screen (z-40, full-screen)
4. Player controls (prominent buttons, centered)
5. Game info bar
6. Current player's hand (visual foreground, purple glow)
7. Opponent hands (secondary, non-interactive)

### Status indicators
| State | Visual signal |
|-------|--------------|
| Active turn | Purple border + glow + pulse animation |
| Player stopped | 60% opacity + red border + "STOPPED" badge |
| Second Chance active | Pulsing red heart icon |
| Force Draw active | Pulsing orange indicator with countdown |
| Bust | Shake animation on card + red centered overlay |

---

## Mobile Design Considerations

### Mobile usage context
- Most sessions will be on mobile (casual games between friends)
- Players share a link or QR code to invite others
- Players typically hold the phone with one hand while playing

### Space constraints
The screen must simultaneously show:
- The player's own hand (potentially 7+ cards)
- Up to 5 opponents (with their hands and scores)
- Action buttons (Draw / Stop)
- Cards are small (`40×56px` currently) to fit on screen
- Card hands use `flex-wrap` to flow into multiple lines

### Mobile recommendations
- **Minimum tap targets:** 44×44px for buttons (WCAG AA compliance)
- **Vertical scroll:** The player list must be scrollable; controls must always be visible
- **No hover dependency:** Interactive states must communicate without relying on hover
- **Thumb zone:** Draw and Stop buttons should be in the bottom half of the screen
- **Card number legibility:** Card values must be readable without zooming
- **Landscape mode:** Consider an alternative layout that takes advantage of the wider viewport
- **Modals:** Should cover the full screen or most of it on mobile, not float like on desktop

### Potential gestures to support
- Tap a card to select it (when playing a special card)
- Swipe up to reveal event history or rules
- Tap on the room code to copy it to clipboard

---

## Desktop Design Considerations

### Desktop usage context
- Less common; typically on screens 1280px or wider
- Opportunity to display more information simultaneously
- Mouse usage enables hover states

### Desktop opportunities
- **Multi-column layout:** Left panel with game info + central play area + right panel with opponents
- **Larger cards:** Cards can be bigger and show more detail
- **Tooltips:** Hovering over cards can show the card name and description
- **Event history sidebar:** Live event log visible on the side
- **Keyboard shortcuts:** Keys to Draw (Space/Enter) and Stop (S/Esc)
- **Opponent hover:** Show hand detail when hovering over an opponent

### Suggested breakpoints
| Breakpoint | Layout |
|------------|--------|
| `< 640px` | Single column, small cards, fixed controls at bottom |
| `640–1024px` | Wider single column, medium cards |
| `> 1024px` | Multi-column: opponent sidebar + central play area |

---

## Visual and Audio Feedback

### Visual feedback per event
| Event | Visual |
|-------|--------|
| Card drawn | `card-appear` animation (scale + rotation) |
| Duplicate number (bust) | `shake` animation on card + red centered overlay |
| Flip7 achieved | Multi-color celebration overlay |
| Special card played | Victim selection overlay + event notification |
| Freeze | Cyan centered overlay |
| Flip Three | Orange overlay + forces 3 draws |
| Game over | Animated confetti + ranking screen |

### Audio feedback (current mapping)
| Event | Sound |
|-------|-------|
| Draw normal card | draw.mp3 |
| Stop drawing | stop.mp3 |
| Bust | duplicates.mp3 |
| Flip7 | flip7.mp3 |
| Special card obtained | special.mp3 |
| Second Chance received | extra-life.mp3 |
| Second Chance activated | cure.mp3 |
| Freeze played | freeze.wav |
| Flip Three played | flip3.mp3 |
| Victory | win.mp3 |

> Sound effects are a key immersion component. The redesign should preserve the event → audio feedback mapping.

---

## Identity and Tone

### Game personality
- **Casual arcade:** Not a serious or hyper-competitive game; meant for fun
- **Surprise and drama:** Busts and Flip7 are high-impact emotional moments
- **Social:** The fun comes from watching others lose (or survive) in real time
- **Accessible:** No account, registration, or installation required

### Suggested visual tone for the redesign
- Maintain **energy and vibrancy** — this is not a minimalist or serious game
- Cards must be **visually distinct** from each other (color coding is essential)
- Victory and bust moments deserve **exaggerated visual celebration**
- Lobby/waiting UI can be calmer; the game UI should have higher visual tension

### Design keywords
`neon`, `arcade`, `vibrant`, `dark`, `exciting`, `casual`, `cards`, `multiplayer`, `colorful`, `immersive`

---

## Design System Requirements Summary

To generate a complete design system with Stitch, tokens and components are needed for:

### Required tokens
- [ ] Color palette: backgrounds, surfaces, text, primaries, semantic colors (error, warning, success, info)
- [ ] Gradients per card (13 numbers + 3 specials + modifiers)
- [ ] Shadow/glow effects per color
- [ ] Typography: hierarchy (heading, body, label, mono for room code)
- [ ] Spacing scale
- [ ] Border radius (current uses `0.75rem`)
- [ ] Animations: durations, easings, keyframes for the 10 animation types

### Required components
- [ ] **PlayingCard** — variants: number, special, modifier; states: normal, hover, selected, disabled, duplicate
- [ ] **PlayerInfo** — states: active, stopped, current turn
- [ ] **GameButton** — variants: draw (cyan), stop (red), primary (purple), secondary
- [ ] **StatusBadge** — variants: your-turn, stopped, second-chance
- [ ] **EventNotification** — event overlay with variants per event type
- [ ] **VictimModal** — selection modal with player list
- [ ] **WinScreen** — victory screen with ranking and confetti
- [ ] **Lobby** — create/join form + rules panel
- [ ] **GameInfoBar** — top bar with round number, room code, invite button
- [ ] **ForceDrawIndicator** — pending Flip Three indicator
