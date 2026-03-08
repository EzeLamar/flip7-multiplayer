import { describe, it, expect, beforeEach } from "vitest";
import {
  generateDeck,
  handleDrawNumberCard,
  handleScoreCards,
  handlePlaySpecialCard,
  getNextPlayerIndex,
  reshuffleDeck,
} from "./game-logic";
import { Card, GameState, Player } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    name: "Alice",
    cards: [],
    lastDrawnCard: null,
    status: "dealing",
    secondChance: false,
    score: 0,
    ...overrides,
  };
}

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    id: "test",
    round: 1,
    players: [],
    currentPlayer: 0,
    deck: [],
    discardPile: [],
    direction: 1,
    flipCount: 1,
    status: "playing",
    lastEvent: null,
    ...overrides,
  };
}

function numCard(value: string): Card {
  return { value, type: "number" };
}

function modCard(value: string): Card {
  return { value, type: "modifier" };
}

function specialCard(value: string): Card {
  return { value, type: "special" };
}

// ─── generateDeck ────────────────────────────────────────────────────────────

describe("generateDeck", () => {
  it("produces exactly 94 cards", () => {
    // 0(×1) + 1–12(×i each = 78) + 6 modifiers + 9 specials = 94
    const deck = generateDeck();
    expect(deck).toHaveLength(94);
  });

  it("contains exactly one 0", () => {
    const deck = generateDeck();
    expect(deck.filter((c) => c.value === "0" && c.type === "number")).toHaveLength(1);
  });

  it("contains i copies of number i for i = 1–12", () => {
    const deck = generateDeck();
    for (let i = 1; i <= 12; i++) {
      const count = deck.filter(
        (c) => c.value === String(i) && c.type === "number"
      ).length;
      expect(count, `expected ${i} copies of card "${i}"`).toBe(i);
    }
  });

  it("contains exactly 1 copy of each modifier card", () => {
    const deck = generateDeck();
    const modifiers = ["x2", "+2", "+4", "+6", "+8", "+10"];
    modifiers.forEach((mod) => {
      expect(deck.filter((c) => c.value === mod && c.type === "modifier")).toHaveLength(1);
    });
  });

  it("contains exactly 3 copies of each special card", () => {
    const deck = generateDeck();
    const specials = ["freeze", "flip three", "second chance"];
    specials.forEach((sp) => {
      expect(deck.filter((c) => c.value === sp && c.type === "special")).toHaveLength(3);
    });
  });
});

// ─── handleScoreCards ────────────────────────────────────────────────────────

describe("handleScoreCards", () => {
  it("returns 0 for an empty hand", () => {
    expect(handleScoreCards([])).toBe(0);
  });

  it("sums number cards correctly", () => {
    const cards = [numCard("3"), numCard("5"), numCard("7")];
    expect(handleScoreCards(cards)).toBe(15);
  });

  it("applies x2 before additive modifiers", () => {
    // numbers sum = 3+5 = 8, x2 → 16, +2 → 18
    const cards = [numCard("3"), numCard("5"), modCard("x2"), modCard("+2")];
    expect(handleScoreCards(cards)).toBe(18);
  });

  it("applies all additive modifiers", () => {
    const cards = [numCard("1"), modCard("+2"), modCard("+4"), modCard("+6"), modCard("+8"), modCard("+10")];
    // 1 + 2 + 4 + 6 + 8 + 10 = 31
    expect(handleScoreCards(cards)).toBe(31);
  });

  it("ignores special cards in score", () => {
    const cards = [numCard("5"), specialCard("freeze")];
    expect(handleScoreCards(cards)).toBe(5);
  });

  it("handles x2 with no number cards", () => {
    // 0 * 2 = 0, +4 → 4
    const cards = [modCard("x2"), modCard("+4")];
    expect(handleScoreCards(cards)).toBe(4);
  });
});

// ─── handleDrawNumberCard ────────────────────────────────────────────────────

describe("handleDrawNumberCard", () => {
  it("returns 'normal' for a unique card", () => {
    const game = makeGame();
    const player = makePlayer({ cards: [numCard("3")] });
    const result = handleDrawNumberCard(game, player, numCard("5"));
    expect(result).toBe("normal");
    expect(player.status).toBe("dealing");
  });

  it("returns 'duplicates' when a number card is already held", () => {
    const game = makeGame();
    const player = makePlayer({ cards: [numCard("5")] });
    const result = handleDrawNumberCard(game, player, numCard("5"));
    expect(result).toBe("duplicates");
    expect(player.status).toBe("stop");
    expect(game.flipCount).toBe(1);
  });

  it("returns 'useSecondChance' when player has second chance on bust", () => {
    const game = makeGame();
    const player = makePlayer({
      cards: [numCard("5"), specialCard("second chance")],
      secondChance: true,
    });
    const result = handleDrawNumberCard(game, player, numCard("5"));
    expect(result).toBe("useSecondChance");
    expect(player.secondChance).toBe(false);
    expect(player.status).toBe("dealing");
    // The duplicate AND the second chance card should both be removed
    expect(player.cards.some((c) => c.value === "5")).toBe(false);
    expect(player.cards.some((c) => c.value === "second chance")).toBe(false);
  });

  it("returns 'flip7' when drawing the 7th unique number card", () => {
    const game = makeGame();
    const cards = [
      numCard("1"),
      numCard("2"),
      numCard("3"),
      numCard("4"),
      numCard("5"),
      numCard("6"),
    ];
    const player = makePlayer({ cards });
    const result = handleDrawNumberCard(game, player, numCard("7"));
    expect(result).toBe("flip7");
    expect(player.status).toBe("stop");
    // Score should include all 7 cards + 15 bonus
    expect(player.score).toBe(1 + 2 + 3 + 4 + 5 + 6 + 7 + 15);
  });

  it("does NOT trigger flip7 on 6 cards (one more is needed)", () => {
    const game = makeGame();
    const cards = [numCard("1"), numCard("2"), numCard("3"), numCard("4"), numCard("5")];
    const player = makePlayer({ cards });
    const result = handleDrawNumberCard(game, player, numCard("6"));
    expect(result).toBe("normal");
  });

  it("flip7 bust check: duplicate takes priority over flip7", () => {
    // Player has 6 number cards but draws a duplicate → bust, not flip7
    const game = makeGame();
    const cards = [
      numCard("1"),
      numCard("2"),
      numCard("3"),
      numCard("4"),
      numCard("5"),
      numCard("6"),
    ];
    const player = makePlayer({ cards });
    // Drawing "1" is a duplicate
    const result = handleDrawNumberCard(game, player, numCard("1"));
    expect(result).toBe("duplicates");
  });
});

// ─── getNextPlayerIndex ───────────────────────────────────────────────────────

describe("getNextPlayerIndex", () => {
  it("advances to next player in turn order (clockwise)", () => {
    const p0 = makePlayer({ id: "p0", status: "dealing" });
    const p1 = makePlayer({ id: "p1", status: "dealing" });
    const game = makeGame({ players: [p0, p1], currentPlayer: 0, direction: 1 });
    expect(getNextPlayerIndex(game)).toBe(1);
  });

  it("wraps around to first player after last player", () => {
    const p0 = makePlayer({ id: "p0", status: "dealing" });
    const p1 = makePlayer({ id: "p1", status: "dealing" });
    const game = makeGame({ players: [p0, p1], currentPlayer: 1, direction: 1 });
    expect(getNextPlayerIndex(game)).toBe(0);
  });

  it("skips stopped players", () => {
    const p0 = makePlayer({ id: "p0", status: "stop" });
    const p1 = makePlayer({ id: "p1", status: "dealing" });
    const p2 = makePlayer({ id: "p2", status: "dealing" });
    const game = makeGame({ players: [p0, p1, p2], currentPlayer: 1, direction: 1 });
    // p1 → p2 (p0 is stopped)
    expect(getNextPlayerIndex(game)).toBe(2);
  });

  it("skips stopped players (counter-clockwise)", () => {
    const p0 = makePlayer({ id: "p0", status: "dealing" });
    const p1 = makePlayer({ id: "p1", status: "dealing" });
    const p2 = makePlayer({ id: "p2", status: "stop" });
    const game = makeGame({ players: [p0, p1, p2], currentPlayer: 1, direction: -1 });
    // p1 → p0 (p2 is stopped, going counter-clockwise)
    expect(getNextPlayerIndex(game)).toBe(0);
  });

  it("starts a new round when all players are stopped", () => {
    const p0 = makePlayer({ id: "p0", status: "stop", cards: [numCard("3")], lastDrawnCard: numCard("3") });
    const p1 = makePlayer({ id: "p1", status: "stop", cards: [numCard("5")], lastDrawnCard: numCard("5") });
    const game = makeGame({
      players: [p0, p1],
      currentPlayer: 1,
      direction: 1,
      round: 1,
      discardPile: [],
    });
    getNextPlayerIndex(game);
    expect(game.round).toBe(2);
    expect(p0.status).toBe("start");
    expect(p1.status).toBe("start");
    // Cards should be cleared and moved to discard pile
    expect(p0.cards).toHaveLength(0);
    expect(p1.cards).toHaveLength(0);
    expect(game.discardPile).toHaveLength(2);
  });

  it("clears lastDrawnCard on round transition", () => {
    const p0 = makePlayer({ id: "p0", status: "stop", lastDrawnCard: specialCard("freeze") });
    const p1 = makePlayer({ id: "p1", status: "stop", lastDrawnCard: numCard("7") });
    const game = makeGame({ players: [p0, p1], currentPlayer: 1 });
    getNextPlayerIndex(game);
    expect(p0.lastDrawnCard).toBeNull();
    expect(p1.lastDrawnCard).toBeNull();
  });

  it("returns 0 when game is finished", () => {
    const p0 = makePlayer({ id: "p0", status: "stop" });
    const p1 = makePlayer({ id: "p1", status: "stop" });
    const game = makeGame({ players: [p0, p1], status: "finished" });
    expect(getNextPlayerIndex(game)).toBe(0);
  });
});

// ─── handlePlaySpecialCard ────────────────────────────────────────────────────

describe("handlePlaySpecialCard", () => {
  describe("freeze", () => {
    it("freezes the target and advances the turn", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing", cards: [numCard("5")] });
      const p1 = makePlayer({ id: "p1", status: "dealing", cards: [numCard("3")] });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0 });

      handlePlaySpecialCard(game, "p1", specialCard("freeze"));

      expect(p1.status).toBe("stop");
      expect(p1.score).toBe(3);
      expect(game.currentPlayer).toBe(0); // turn advances past frozen p1 back to p0? No: from p0, next active is p0 (p1 stopped)
    });

    it("locks the frozen player's score", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing" });
      const p1 = makePlayer({
        id: "p1",
        status: "dealing",
        cards: [numCard("4"), numCard("6"), modCard("+2")],
      });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0 });

      handlePlaySpecialCard(game, "p1", specialCard("freeze"));

      // 4 + 6 = 10, +2 = 12
      expect(p1.score).toBe(12);
    });

    it("marks game finished if frozen player hits MAX_SCORE", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing" });
      const p1 = makePlayer({
        id: "p1",
        status: "dealing",
        score: 195,
        cards: [numCard("5")],
      });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0 });

      handlePlaySpecialCard(game, "p1", specialCard("freeze"));

      expect(p1.score).toBe(200);
      expect(game.status).toBe("finished");
    });
  });

  describe("flip three", () => {
    it("makes the victim the current player and increments flipCount by 3", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing" });
      const p1 = makePlayer({ id: "p1", status: "dealing" });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0, flipCount: 1 });

      handlePlaySpecialCard(game, "p1", specialCard("flip three"));

      expect(game.currentPlayer).toBe(1);
      expect(game.flipCount).toBe(4); // 1 + 3
    });
  });

  describe("second chance", () => {
    it("gives second chance to the target player", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing" });
      const p1 = makePlayer({ id: "p1", status: "dealing" });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0 });

      handlePlaySpecialCard(game, "p1", specialCard("second chance"));

      expect(p1.secondChance).toBe(true);
    });

    it("redirects to another eligible player if target already has second chance", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing", secondChance: false });
      const p1 = makePlayer({ id: "p1", status: "dealing", secondChance: true });
      const game = makeGame({ players: [p0, p1], currentPlayer: 1 });

      handlePlaySpecialCard(game, "p1", specialCard("second chance"));

      expect(p0.secondChance).toBe(true);
      // p1 still has it
      expect(p1.secondChance).toBe(true);
    });

    it("advances the turn after playing second chance with flipCount === 1", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing" });
      const p1 = makePlayer({ id: "p1", status: "dealing" });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0, flipCount: 1 });

      handlePlaySpecialCard(game, "p1", specialCard("second chance"));

      expect(game.currentPlayer).toBe(1);
    });
  });
});

// ─── reshuffleDeck ────────────────────────────────────────────────────────────

describe("reshuffleDeck", () => {
  it("refills the deck from the discard pile and keeps the top card separate", () => {
    const topCard = numCard("9");
    const game = makeGame({
      deck: [],
      discardPile: [numCard("1"), numCard("2"), numCard("3"), topCard],
    });

    reshuffleDeck(game);

    expect(game.discardPile).toHaveLength(1);
    expect(game.discardPile[0]).toEqual(topCard);
    // deck should now have the previous discard pile cards + 9 special cards added
    expect(game.deck.length).toBeGreaterThan(0);
  });
});
