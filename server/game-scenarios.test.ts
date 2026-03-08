/**
 * Integration-style tests that simulate complete multi-step game scenarios
 * using the exported game-logic functions (no Socket.IO server required).
 *
 * These tests exercise the same code paths the socket handlers call, covering
 * multi-round flows, special card interactions, and win conditions.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateDeck,
  handleDrawNumberCard,
  handleScoreCards,
  handlePlaySpecialCard,
  getNextPlayerIndex,
} from "./game-logic";
import { Card, GameState, Player } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePlayer(id: string, name: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name,
    cards: [],
    lastDrawnCard: null,
    status: "start",
    secondChance: false,
    score: 0,
    ...overrides,
  };
}

function makeGame(players: Player[]): GameState {
  return {
    id: "game1",
    round: 1,
    players,
    currentPlayer: 0,
    deck: generateDeck(),
    discardPile: [],
    direction: 1,
    flipCount: 1,
    status: "playing",
    lastEvent: null,
  };
}

/** Simulate drawing a specific card for the current player (as the socket handler does). */
function simulateDrawCard(game: GameState, card: Card): string {
  const player = game.players[game.currentPlayer];

  if (player.status === "start") {
    player.status = "dealing";
    player.cards = [];
  }

  player.lastDrawnCard = card;

  let status: string = "normal";

  switch (card.type) {
    case "number": {
      const result = handleDrawNumberCard(game, player, card);
      status = result;
      if (result === "flip7") {
        game.players.forEach((p) => {
          if (p.status === "dealing") {
            p.score += handleScoreCards(p.cards);
            p.status = "stop";
          }
        });
        if (game.players.some((p) => p.score >= 200)) game.status = "finished";
        game.currentPlayer = getNextPlayerIndex(game);
      } else if (result === "duplicates") {
        game.currentPlayer = getNextPlayerIndex(game);
      } else {
        game.currentPlayer = getNextPlayerIndex(game);
      }
      break;
    }
    case "modifier":
      game.currentPlayer = getNextPlayerIndex(game);
      break;
    case "special":
      status = "special";
      break;
  }

  player.cards.push(card);
  return status;
}

/** Simulate the stopDrawCard socket event for the current player. */
function simulateStop(game: GameState) {
  const player = game.players[game.currentPlayer];
  player.score += handleScoreCards(player.cards);
  player.status = "stop";
  if (player.score >= 200) game.status = "finished";
  game.currentPlayer = getNextPlayerIndex(game);
}

// ─── Scenario: Basic two-player round ────────────────────────────────────────

describe("Basic two-player round", () => {
  let game: GameState;
  let alice: Player;
  let bob: Player;

  beforeEach(() => {
    alice = makePlayer("alice", "Alice");
    bob = makePlayer("bob", "Bob");
    game = makeGame([alice, bob]);
  });

  it("turn alternates between players after each draw", () => {
    // Alice draws
    simulateDrawCard(game, { value: "3", type: "number" });
    expect(game.currentPlayer).toBe(1); // Bob's turn

    // Bob draws
    simulateDrawCard(game, { value: "5", type: "number" });
    expect(game.currentPlayer).toBe(0); // Alice's turn again
  });

  it("stopping scores the current hand and passes the turn", () => {
    // In the one-draw-per-turn model, cards accumulate across multiple turns.
    // Turn 1: Alice draws 3 (alice.cards=[3]) → Bob
    simulateDrawCard(game, { value: "3", type: "number" });
    // Turn 2: Bob draws 5 (bob.cards=[5]) → Alice
    simulateDrawCard(game, { value: "5", type: "number" });
    // Turn 3: Alice draws 7 (alice.cards=[3,7]) → Bob
    simulateDrawCard(game, { value: "7", type: "number" });
    // Turn 4: Bob draws 2 (bob.cards=[5,2]) → Alice
    simulateDrawCard(game, { value: "2", type: "number" });

    // Alice stops on her turn (has cards [3, 7])
    expect(game.currentPlayer).toBe(0);
    simulateStop(game);

    expect(alice.score).toBe(3 + 7);
    expect(alice.status).toBe("stop");
    expect(game.currentPlayer).toBe(1); // Bob's turn
  });

  it("round resets after all players stop", () => {
    simulateDrawCard(game, { value: "3", type: "number" }); // Alice draws, turn → Bob
    simulateStop(game); // Bob stops (no cards → 0 pts), turn → Alice
    simulateStop(game); // Alice stops, round ends

    expect(game.round).toBe(2);
    expect(alice.status).toBe("start");
    expect(bob.status).toBe("start");
    expect(alice.lastDrawnCard).toBeNull();
    expect(bob.lastDrawnCard).toBeNull();
  });

  it("players can draw again after round resets", () => {
    // Round 1: Alice draws, then both stop so Bob is the last stopper
    simulateDrawCard(game, { value: "1", type: "number" }); // Alice (→Bob)
    simulateDrawCard(game, { value: "2", type: "number" }); // Bob (→Alice)
    simulateStop(game); // Alice stops (→Bob)
    simulateStop(game); // Bob stops → round 2 starts; next after Bob is Alice

    // Round 2 starts — Alice (index 0) goes first because Bob (index 1) was last
    expect(game.round).toBe(2);
    expect(alice.status).toBe("start");
    expect(game.currentPlayer).toBe(0); // Alice starts round 2
    simulateDrawCard(game, { value: "3", type: "number" });
    expect(alice.status).toBe("dealing");
  });
});

// ─── Scenario: Bust (duplicate number card) ───────────────────────────────────

describe("Bust scenario", () => {
  it("busted player loses their round cards and passes the turn", () => {
    const alice = makePlayer("alice", "Alice", { score: 10 });
    const bob = makePlayer("bob", "Bob");
    const game = makeGame([alice, bob]);

    simulateDrawCard(game, { value: "5", type: "number" }); // Alice draws 5 → Bob
    simulateDrawCard(game, { value: "3", type: "number" }); // Bob draws 3 → Alice

    // Alice draws another 5 → bust
    const result = simulateDrawCard(game, { value: "5", type: "number" });
    expect(result).toBe("duplicates");
    expect(alice.status).toBe("stop");
    // Prior score unaffected by bust; round cards cleared when next round starts
    expect(alice.score).toBe(10);
  });
});

// ─── Scenario: Second Chance ──────────────────────────────────────────────────

describe("Second Chance scenario", () => {
  it("second chance prevents a bust and removes both cards", () => {
    const alice = makePlayer("alice", "Alice", {
      status: "dealing",
      cards: [
        { value: "5", type: "number" },
        { value: "second chance", type: "special" },
      ],
      secondChance: true,
    });
    const game = makeGame([alice]);

    const result = handleDrawNumberCard(game, alice, { value: "5", type: "number" });

    expect(result).toBe("useSecondChance");
    expect(alice.status).toBe("dealing");
    expect(alice.secondChance).toBe(false);
    expect(alice.cards.some((c) => c.value === "5")).toBe(false);
    expect(alice.cards.some((c) => c.value === "second chance")).toBe(false);
  });
});

// ─── Scenario: Flip 7 bonus ───────────────────────────────────────────────────

describe("Flip 7 scenario", () => {
  it("gives +15 bonus and ends the round for all active players", () => {
    const alice = makePlayer("alice", "Alice");
    const bob = makePlayer("bob", "Bob");
    const game = makeGame([alice, bob]);

    // Give Alice 6 unique number cards
    alice.status = "dealing";
    alice.cards = [
      { value: "1", type: "number" },
      { value: "2", type: "number" },
      { value: "3", type: "number" },
      { value: "4", type: "number" },
      { value: "5", type: "number" },
      { value: "6", type: "number" },
    ];

    // Give Bob some cards
    bob.status = "dealing";
    bob.cards = [{ value: "8", type: "number" }];

    game.currentPlayer = 0;

    const result = handleDrawNumberCard(game, alice, { value: "7", type: "number" });

    expect(result).toBe("flip7");
    expect(alice.status).toBe("stop");
    expect(alice.score).toBe(1 + 2 + 3 + 4 + 5 + 6 + 7 + 15);

    // Simulate what the socket handler does after flip7:
    game.players.forEach((p) => {
      if (p.status === "dealing") {
        p.score += handleScoreCards(p.cards);
        p.status = "stop";
      }
    });

    expect(bob.status).toBe("stop");
    expect(bob.score).toBe(8);
  });

  it("flip7 with modifier cards scores modifiers too", () => {
    const alice = makePlayer("alice", "Alice");
    alice.status = "dealing";
    alice.cards = [
      { value: "1", type: "number" },
      { value: "2", type: "number" },
      { value: "3", type: "number" },
      { value: "4", type: "number" },
      { value: "5", type: "number" },
      { value: "6", type: "number" },
      { value: "x2", type: "modifier" },
    ];
    const game = makeGame([alice]);

    const result = handleDrawNumberCard(game, alice, { value: "7", type: "number" });

    expect(result).toBe("flip7");
    // numbers: 1+2+3+4+5+6+7 = 28, x2 → 56, +15 = 71
    expect(alice.score).toBe(71);
  });
});

// ─── Scenario: Freeze special card ───────────────────────────────────────────

describe("Freeze special card", () => {
  it("freezes target, scores their hand, and advances turn", () => {
    const alice = makePlayer("alice", "Alice", { status: "dealing" });
    const bob = makePlayer("bob", "Bob", {
      status: "dealing",
      cards: [{ value: "4", type: "number" }, { value: "6", type: "number" }],
    });
    const game = makeGame([alice, bob]);
    game.currentPlayer = 0;

    handlePlaySpecialCard(game, "bob", { value: "freeze", type: "special" });

    expect(bob.status).toBe("stop");
    expect(bob.score).toBe(10);
    // Turn should advance past bob (who is now stopped) back to alice
    expect(game.currentPlayer).toBe(0);
  });
});

// ─── Scenario: Flip Three special card ───────────────────────────────────────

describe("Flip Three special card", () => {
  it("targets victim must draw 3 cards (flipCount incremented)", () => {
    const alice = makePlayer("alice", "Alice", { status: "dealing" });
    const bob = makePlayer("bob", "Bob", { status: "dealing" });
    const game = makeGame([alice, bob]);
    game.currentPlayer = 0;
    game.flipCount = 1;

    handlePlaySpecialCard(game, "bob", { value: "flip three", type: "special" });

    expect(game.currentPlayer).toBe(1); // Bob is now forced to draw
    expect(game.flipCount).toBe(4); // 1 original + 3
  });
});

// ─── Scenario: Win condition ──────────────────────────────────────────────────

describe("Win condition", () => {
  it("game finishes when a player reaches 200 points via stop", () => {
    const alice = makePlayer("alice", "Alice", {
      status: "dealing",
      score: 190,
      cards: [{ value: "10", type: "number" }],
    });
    const bob = makePlayer("bob", "Bob", { status: "dealing" });
    const game = makeGame([alice, bob]);
    game.currentPlayer = 0;

    simulateStop(game);

    expect(alice.score).toBe(200);
    expect(game.status).toBe("finished");
  });

  it("game finishes when freeze pushes a player to 200 points", () => {
    const alice = makePlayer("alice", "Alice", { status: "dealing" });
    const bob = makePlayer("bob", "Bob", {
      status: "dealing",
      score: 195,
      cards: [{ value: "5", type: "number" }],
    });
    const game = makeGame([alice, bob]);
    game.currentPlayer = 0;

    handlePlaySpecialCard(game, "bob", { value: "freeze", type: "special" });

    expect(bob.score).toBe(200);
    expect(game.status).toBe("finished");
  });
});

// ─── Scenario: Multi-round game ───────────────────────────────────────────────

describe("Multi-round game", () => {
  it("scores accumulate across rounds", () => {
    const alice = makePlayer("alice", "Alice");
    const bob = makePlayer("bob", "Bob");
    const game = makeGame([alice, bob]);

    // Round 1
    simulateDrawCard(game, { value: "5", type: "number" }); // Alice → Bob
    simulateDrawCard(game, { value: "3", type: "number" }); // Bob → Alice
    simulateStop(game); // Alice stops (5pts) → Bob
    simulateStop(game); // Bob stops (3pts) → round 2 starts

    expect(alice.score).toBe(5);
    expect(bob.score).toBe(3);
    expect(game.round).toBe(2);

    // Round 2
    simulateDrawCard(game, { value: "4", type: "number" }); // Alice → Bob
    simulateDrawCard(game, { value: "6", type: "number" }); // Bob → Alice
    simulateStop(game); // Alice stops (+4pts = 9) → Bob
    simulateStop(game); // Bob stops (+6pts = 9) → round 3 starts

    expect(alice.score).toBe(9);
    expect(bob.score).toBe(9);
    expect(game.round).toBe(3);
  });

  it("lastDrawnCard is null at start of each new round", () => {
    const alice = makePlayer("alice", "Alice");
    const bob = makePlayer("bob", "Bob");
    const game = makeGame([alice, bob]);

    // Alice draws a special card
    simulateDrawCard(game, { value: "freeze", type: "special" });
    // Simulate playing it immediately (alice targets herself to freeze/stop)
    handlePlaySpecialCard(game, "alice", { value: "freeze", type: "special" });
    // Now bob stops
    simulateStop(game); // round resets

    expect(alice.lastDrawnCard).toBeNull();
    expect(bob.lastDrawnCard).toBeNull();
  });

  it("player cards are cleared at round start", () => {
    const alice = makePlayer("alice", "Alice");
    const bob = makePlayer("bob", "Bob");
    const game = makeGame([alice, bob]);

    simulateDrawCard(game, { value: "5", type: "number" }); // Alice → Bob
    simulateStop(game); // Bob → Alice
    simulateStop(game); // Alice → round 2 starts

    // Both players should have empty cards
    expect(alice.cards).toHaveLength(0);
    expect(bob.cards).toHaveLength(0);
  });
});

// ─── Scenario: Direction reversal (counter-clockwise) ────────────────────────

describe("Turn direction", () => {
  it("reverses turn order when direction is -1", () => {
    const p0 = makePlayer("p0", "P0", { status: "dealing" });
    const p1 = makePlayer("p1", "P1", { status: "dealing" });
    const p2 = makePlayer("p2", "P2", { status: "dealing" });
    const game = makeGame([p0, p1, p2]);
    game.direction = -1;
    game.currentPlayer = 0;

    // From p0 going counter-clockwise: next should be p2
    const next = getNextPlayerIndex(game);
    expect(next).toBe(2);
  });
});
