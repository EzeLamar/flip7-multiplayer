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
    mode: "classic",
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

  it("classic mode does NOT include ÷2", () => {
    const deck = generateDeck("classic");
    expect(deck.filter((c) => c.value === "÷2")).toHaveLength(0);
  });

  describe("vengeance mode", () => {
    it("produces exactly 112 cards", () => {
      // 79 numbers + 2 special numbers + 7 modifiers + 24 specials = 112
      const deck = generateDeck("vengeance");
      expect(deck).toHaveLength(112);
    });

    it("includes exactly 1 copy of ÷2", () => {
      const deck = generateDeck("vengeance");
      expect(deck.filter((c) => c.value === "÷2" && c.type === "modifier")).toHaveLength(1);
    });

    it("includes lucky 13 and unlucky 7", () => {
      const deck = generateDeck("vengeance");
      expect(deck.filter((c) => c.value === "lucky 13")).toHaveLength(1);
      expect(deck.filter((c) => c.value === "unlucky 7")).toHaveLength(1);
    });

    it("includes 3 copies each of all 8 vengeance specials", () => {
      const deck = generateDeck("vengeance");
      const specials = ["freeze", "flip three", "second chance", "flip four", "just one more", "steal", "discard", "swap"];
      specials.forEach((sp) => {
        expect(deck.filter((c) => c.value === sp && c.type === "special"), `expected 3× "${sp}"`).toHaveLength(3);
      });
    });
  });

  describe("custom mode", () => {
    it("includes ÷2 when selected in enabledVengeanceModifiers", () => {
      const deck = generateDeck("custom", {
        enabledSpecials: ["freeze", "flip three", "second chance"],
        enabledSpecialNumbers: [],
        enabledVengeanceModifiers: ["÷2"],
      });
      expect(deck.filter((c) => c.value === "÷2" && c.type === "modifier")).toHaveLength(1);
    });

    it("does NOT include ÷2 when not selected", () => {
      const deck = generateDeck("custom", {
        enabledSpecials: ["freeze", "flip three", "second chance"],
        enabledSpecialNumbers: [],
        enabledVengeanceModifiers: [],
      });
      expect(deck.filter((c) => c.value === "÷2")).toHaveLength(0);
    });

    it("falls back to classic deck when customConfig is missing", () => {
      const deck = generateDeck("custom");
      expect(deck).toHaveLength(94);
      expect(deck.filter((c) => c.value === "÷2")).toHaveLength(0);
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

  it("scores lucky 13 as 13 (not NaN)", () => {
    const cards = [numCard("lucky 13"), numCard("5")];
    expect(handleScoreCards(cards)).toBe(18);
  });

  it("scores unlucky 7 as 7 (not NaN)", () => {
    const cards = [numCard("unlucky 7")];
    expect(handleScoreCards(cards)).toBe(7);
  });

  it("lucky 13 with x2 modifier scores correctly", () => {
    // 13 * 2 + 4 = 30
    const cards = [numCard("lucky 13"), modCard("x2"), modCard("+4")];
    expect(handleScoreCards(cards)).toBe(30);
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

  describe("swap", () => {
    it("swaps cards between attacker and victim", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing", cards: [numCard("3")] });
      const p1 = makePlayer({ id: "p1", status: "dealing", cards: [numCard("7")] });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0, flipCount: 1 });

      handlePlaySpecialCard(game, "p1", specialCard("swap"), numCard("7"), numCard("3"));

      expect(p0.cards.some((c) => c.value === "7")).toBe(true);
      expect(p1.cards.some((c) => c.value === "3")).toBe(true);
      expect(game.currentPlayer).toBe(1);
    });

    it("advances turn when swap has no targetCard (no valid targets)", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing", cards: [] });
      const p1 = makePlayer({ id: "p1", status: "dealing", cards: [] });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0, flipCount: 1 });

      handlePlaySpecialCard(game, "p1", specialCard("swap"));

      expect(game.currentPlayer).toBe(1);
    });

    it("advances turn when cards not found in hands (no matching cards)", () => {
      const p0 = makePlayer({ id: "p0", status: "dealing", cards: [numCard("5")] });
      const p1 = makePlayer({ id: "p1", status: "dealing", cards: [numCard("9")] });
      const game = makeGame({ players: [p0, p1], currentPlayer: 0, flipCount: 1 });

      handlePlaySpecialCard(game, "p1", specialCard("swap"), numCard("99"), numCard("99"));

      expect(p0.cards[0].value).toBe("5");
      expect(p1.cards[0].value).toBe("9");
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
    expect(game.deck.length).toBeGreaterThan(0);
  });

  it("vengeance: reshuffled deck has exactly 1 copy of ÷2 even when ÷2 was already in discard pile", () => {
    const topCard = numCard("9");
    const game = makeGame({
      mode: "vengeance",
      deck: [],
      discardPile: [
        numCard("3"),
        numCard("5"),
        { value: "÷2", type: "modifier" }, // ÷2 already in discard pile
        topCard,
      ],
    });

    reshuffleDeck(game);

    const div2Cards = game.deck.filter((c) => c.value === "÷2");
    expect(div2Cards).toHaveLength(1);
  });

  it("vengeance: reshuffled deck has exactly 1 copy of ÷2 when ÷2 is in player hand (not in discard)", () => {
    const topCard = numCard("9");
    const game = makeGame({
      mode: "vengeance",
      deck: [],
      discardPile: [numCard("3"), numCard("5"), topCard],
      // ÷2 is not in discard pile (assume it's in a player's hand)
    });

    reshuffleDeck(game);

    const div2Cards = game.deck.filter((c) => c.value === "÷2");
    expect(div2Cards).toHaveLength(1);
  });

  it("vengeance: reshuffled deck has exactly 3 copies of each special card", () => {
    const topCard = numCard("9");
    const specials = ["freeze", "flip three", "second chance", "flip four", "just one more", "steal", "discard", "swap"];
    const game = makeGame({
      mode: "vengeance",
      deck: [],
      discardPile: [
        // Add some specials that were already played/discarded
        specialCard("freeze"),
        specialCard("freeze"),
        specialCard("flip three"),
        numCard("3"),
        topCard,
      ],
    });

    reshuffleDeck(game);

    specials.forEach((sp) => {
      const count = game.deck.filter((c) => c.value === sp && c.type === "special").length;
      expect(count, `expected 3× "${sp}" after reshuffle`).toBe(3);
    });
  });

  it("custom: reshuffled deck has exactly 1 copy of ÷2 when selected, even if already in discard", () => {
    const topCard = numCard("9");
    const game = makeGame({
      mode: "custom",
      customConfig: {
        enabledSpecials: ["freeze"],
        enabledSpecialNumbers: [],
        enabledVengeanceModifiers: ["÷2"],
      },
      deck: [],
      discardPile: [
        numCard("3"),
        { value: "÷2", type: "modifier" }, // already in discard
        topCard,
      ],
    });

    reshuffleDeck(game);

    const div2Cards = game.deck.filter((c) => c.value === "÷2");
    expect(div2Cards).toHaveLength(1);
  });

  it("custom: reshuffled deck has no ÷2 when not selected", () => {
    const topCard = numCard("9");
    const game = makeGame({
      mode: "custom",
      customConfig: {
        enabledSpecials: ["freeze"],
        enabledSpecialNumbers: [],
        enabledVengeanceModifiers: [],
      },
      deck: [],
      discardPile: [numCard("3"), numCard("5"), topCard],
    });

    reshuffleDeck(game);

    expect(game.deck.filter((c) => c.value === "÷2")).toHaveLength(0);
  });
});
