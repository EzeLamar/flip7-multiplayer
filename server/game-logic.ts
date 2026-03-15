import { GameState, Card, Player, PlayerHandStatus } from "@/lib/types";

const MAX_SCORE = 200;

export function generateDeck(): Card[] {
  // Generates ["0","1","2",...,"12"]; the loop adds i copies of each value
  // ("0" contributes 0 copies, handled by the explicit push below)
  const numbers = Array.from({ length: 13 }, (_, i) => i.toString());
  const modifiers = ["x2", "+2", "+4", "+6", "+8", "+10"];
  const specials = ["freeze", "flip three", "second chance"];
  const deck: Card[] = [];

  deck.push({ value: "0", type: "number" });
  numbers.forEach((number) => {
    for (let i = 0; i < parseInt(number); i++) {
      deck.push({ value: number, type: "number" });
    }
  });
  modifiers.forEach((modifier) => {
    deck.push({ value: modifier, type: "modifier" });
  });

  specials.forEach((special) => {
    for (let i = 0; i < 3; i++) {
      deck.push({ value: special, type: "special" });
    }
  });

  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function dealInitialCards(game: GameState) {
  // Official rules: each player receives exactly 1 card face-up at round start
  game.players.forEach((player) => {
    player.cards = game.deck.splice(0, 1);
  });
}

export function handleScoreCards(cards: Card[]): number {
  let score = 0;
  const numberCards = cards.filter((card) => card.type === "number");
  const modifierCards = cards.filter((card) => card.type === "modifier");
  numberCards.forEach((card) => {
    score += parseInt(card.value);
  });
  // Apply x2 first (doubles number-card total), then additive modifiers
  if (modifierCards.some((card) => card.value === "x2")) {
    score *= 2;
  }
  modifierCards.forEach((card) => {
    switch (card.value) {
      case "+2":
        score += 2;
        break;
      case "+4":
        score += 4;
        break;
      case "+6":
        score += 6;
        break;
      case "+8":
        score += 8;
        break;
      case "+10":
        score += 10;
        break;
    }
  });

  return score;
}

export function handleDrawNumberCard(
  game: GameState,
  player: Player,
  newCard: Card
): PlayerHandStatus {
  if (
    player.cards
      .filter((card) => card.type === "number")
      .find((card) => card.value === newCard.value)
  ) {
    if (player.secondChance) {
      const firstRepeatedCardIndex = player.cards.findIndex(
        (card) => card.value === newCard.value
      );
      player.cards.splice(firstRepeatedCardIndex, 1);
      const secondChanceCardIndex = player.cards.findIndex(
        (card) => card.value === "second chance"
      );
      player.cards.splice(secondChanceCardIndex, 1);
      player.secondChance = false;
      return "useSecondChance";
    }

    player.busted = true;
    player.status = "stop";
    game.flipCount = 1;
    return "duplicates";
  }

  // Check BEFORE adding the card: player currently has 6 number cards and
  // newCard is the 7th unique → Flip 7 bonus triggers
  if (player.cards.filter((card) => card.type === "number").length === 6) {
    player.status = "stop";
    game.flipCount = 1;
    player.secondChance = false;
    // Include the 7th card (newCard) in the score calculation
    player.score = player.score + handleScoreCards([...player.cards, newCard]) + 15;
    return "flip7";
  }

  return "normal";
}

export function handleDrawSpecialCard(_player: Player, _newCard: Card) {
  // Special cards are held in hand and played via the playCard event.
  return;
}

export function handlePlaySpecialCard(
  game: GameState,
  victimId: string,
  playedCard: Card
) {
  const victim = game.players.find((player) => player.id === victimId);
  const currentPlayer = game.players[game.currentPlayer];
  if (!victim) {
    return;
  }

  if (playedCard.value === "freeze") {
    victim.status = "stop";
    victim.secondChance = false;
    if (currentPlayer.id === victim.id) {
      game.flipCount = 1;
    }

    victim.score = victim.score + handleScoreCards(victim.cards);
    if (victim.score >= MAX_SCORE) {
      game.status = "finished";
    }

    game.currentPlayer = getNextPlayerIndex(game);

    return;
  }

  if (playedCard.value === "flip three") {
    game.flipCount = game.flipCount + 3;
    game.currentPlayer = game.players.findIndex(
      (player) => player.id === victimId
    );

    return;
  }

  if (playedCard.value === "second chance") {
    if (victim.secondChance) {
      // Victim already has one: give it to another active player without one
      const otherEligible = game.players.find(
        (p) => p.id !== victimId && p.status === "dealing" && !p.secondChance
      );
      if (otherEligible) {
        otherEligible.secondChance = true;
      }
      // else: no eligible player → card is discarded (no assignment)
    } else {
      victim.secondChance = true;
    }
    if (game.flipCount === 1) {
      game.currentPlayer = getNextPlayerIndex(game);
    }

    return;
  }
}

export function getNextPlayerIndex(game: GameState): number {
  if (game.status === "finished") {
    return 0;
  }

  // If already in round-ending state, return the already-computed next player
  if (game.roundEnding) {
    return game.currentPlayer;
  }

  // When all players have stopped, enter round-ending state instead of
  // immediately resetting — cards stay visible until the first draw of the new round
  if (game.players.every((player) => player.status === "stop")) {
    game.roundEnding = true;
    // Compute which player draws first in the new round (circular order)
    const len = game.players.length;
    const nextIndex =
      ((game.currentPlayer + game.direction) % len + len) % len;
    return nextIndex;
  }

  const currentPlayerIndex = game.currentPlayer;
  const dealingPlayerIndices = game.players.reduce(
    (indices, player, index) =>
      player.status === "dealing" || player.status === "start"
        ? [...indices, index]
        : indices,
    [] as number[]
  );
  const currentPlayerDealingIndex =
    dealingPlayerIndices.indexOf(currentPlayerIndex);

  // Use double-modulo to handle direction=-1 correctly in JS
  // (JS % can return negative values unlike Python)
  const len = dealingPlayerIndices.length;
  const nextPlayerIndex =
    ((currentPlayerDealingIndex + game.direction) % len + len) % len;
  return dealingPlayerIndices[nextPlayerIndex];
}

export function reshuffleDeck(game: GameState) {
  const specials = ["freeze", "flip three", "second chance"];

  const topCard = game.discardPile.pop()!;
  specials.forEach((special) => {
    for (let i = 0; i < 3; i++) {
      game.discardPile.push({ value: special, type: "special" });
    }
  });
  game.deck = shuffle(game.discardPile);
  game.discardPile = [topCard];
}
