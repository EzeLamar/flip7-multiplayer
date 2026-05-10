import { GameState, Card, Player, PlayerHandStatus, GameCustomConfig } from "@/lib/types";

const MAX_SCORE = 200;

export function generateDeck(
  mode: "classic" | "vengeance" | "custom" = "classic",
  customConfig?: GameCustomConfig
): Card[] {
  const numbers = Array.from({ length: 13 }, (_, i) => i.toString());

  let specials: string[];
  let extraModifiers: string[] = [];
  let specialNumbers: string[] = [];

  if (mode === "vengeance") {
    specials = ["freeze", "flip three", "second chance", "flip four", "just one more", "steal", "discard", "swap"];
    extraModifiers = ["÷2"];
    specialNumbers = ["lucky 13", "unlucky 7"];
  } else if (mode === "custom" && customConfig) {
    specials = customConfig.enabledSpecials;
    extraModifiers = customConfig.enabledVengeanceModifiers;
    specialNumbers = customConfig.enabledSpecialNumbers;
  } else {
    specials = ["freeze", "flip three", "second chance"];
  }

  const baseModifiers = ["x2", "+2", "+4", "+6", "+8", "+10"];
  const deck: Card[] = [];

  deck.push({ value: "0", type: "number" });
  numbers.forEach((number) => {
    for (let i = 0; i < parseInt(number); i++) {
      deck.push({ value: number, type: "number" });
    }
  });
  specialNumbers.forEach((n) => deck.push({ value: n, type: "number" }));
  [...baseModifiers, ...extraModifiers].forEach((m) => deck.push({ value: m, type: "modifier" }));
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
    if (card.value === "lucky 13") score += 13;
    else if (card.value === "unlucky 7") score += 7;
    else score += parseInt(card.value);
  });
  // Apply x2 first (doubles number-card total), then ÷2, then additive modifiers
  if (modifierCards.some((card) => card.value === "x2")) {
    score *= 2;
  }
  if (modifierCards.some((card) => card.value === "÷2")) {
    score = Math.floor(score / 2);
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
  // Unlucky 7: discard all current number cards from hand
  if (newCard.value === "unlucky 7") {
    player.cards = player.cards.filter((card) => card.type !== "number");
    return "unlucky7" as PlayerHandStatus;
  }

  // Lucky 13 bust logic: "13" and "lucky 13" share the same slot.
  // Two cards of the 13-family → no bust. Three → bust.
  const is13Family = newCard.value === "13" || newCard.value === "lucky 13";
  if (is13Family) {
    const family13Count = player.cards.filter(
      (c) => c.type === "number" && (c.value === "13" || c.value === "lucky 13")
    ).length;
    if (family13Count >= 2) {
      // Third 13-family card causes bust
      if (player.secondChance) {
        const firstIndex = player.cards.findIndex(
          (c) => c.value === "13" || c.value === "lucky 13"
        );
        player.cards.splice(firstIndex, 1);
        const scIndex = player.cards.findIndex((c) => c.value === "second chance");
        player.cards.splice(scIndex, 1);
        player.secondChance = false;
        return "useSecondChance";
      }
      player.status = "stop";
      game.flipCount = 1;
      return "duplicates";
    }
    // One or zero 13-family cards: no bust, treat as unique for Flip 7 purposes
    if (player.cards.filter((card) => card.type === "number").length === 6) {
      player.status = "stop";
      game.flipCount = 1;
      player.secondChance = false;
      player.score = player.score + handleScoreCards([...player.cards, newCard]) + 15;
      return "flip7";
    }
    return "normal";
  }

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

export interface SpecialCardCheckResult {
  stealCheck?: "normal" | "duplicates" | "useSecondChance" | "flip7";
  swapCurrentPlayerCheck?: "normal" | "duplicates" | "useSecondChance" | "flip7";
  swapVictimCheck?: "normal" | "duplicates" | "useSecondChance" | "flip7";
}

// Checks a player's hand after receiving a number card (card already in hand).
function checkPlayerHandAfterCardGain(
  game: GameState,
  player: Player,
  gainedCard: Card
): "normal" | "duplicates" | "useSecondChance" | "flip7" {
  if (gainedCard.type !== "number") return "normal";

  const numberCards = player.cards.filter((c) => c.type === "number");
  const is13Family = gainedCard.value === "13" || gainedCard.value === "lucky 13";

  if (is13Family) {
    const count = numberCards.filter(
      (c) => c.value === "13" || c.value === "lucky 13"
    ).length;
    if (count >= 3) {
      if (player.secondChance) {
        const idx = player.cards.findIndex(
          (c) => c.value === "13" || c.value === "lucky 13"
        );
        player.cards.splice(idx, 1);
        const scIdx = player.cards.findIndex((c) => c.value === "second chance");
        player.cards.splice(scIdx, 1);
        player.secondChance = false;
        return "useSecondChance";
      }
      player.status = "stop";
      game.flipCount = 1;
      return "duplicates";
    }
  } else {
    const count = numberCards.filter((c) => c.value === gainedCard.value).length;
    if (count >= 2) {
      if (player.secondChance) {
        const idx = player.cards.findIndex((c) => c.value === gainedCard.value);
        player.cards.splice(idx, 1);
        const scIdx = player.cards.findIndex((c) => c.value === "second chance");
        player.cards.splice(scIdx, 1);
        player.secondChance = false;
        return "useSecondChance";
      }
      player.status = "stop";
      game.flipCount = 1;
      return "duplicates";
    }
  }

  // Flip7: 7 unique number cards now in hand (gained card already included)
  if (numberCards.length >= 7) {
    player.status = "stop";
    game.flipCount = 1;
    player.secondChance = false;
    player.score += handleScoreCards(player.cards) + 15;
    return "flip7";
  }

  return "normal";
}

// Ends the current round for all players still drawing, applying their scores.
function endRoundForActivePlayers(game: GameState) {
  game.players.forEach((p) => {
    if (p.status === "dealing") {
      p.score += handleScoreCards(p.cards);
      p.status = "stop";
      p.secondChance = false;
      p.pendingJustOneMore = false;
    }
  });
  if (game.players.some((p) => p.score >= MAX_SCORE)) {
    game.status = "finished";
  }
}

export function handlePlaySpecialCard(
  game: GameState,
  victimId: string,
  playedCard: Card,
  targetCard?: Card,
  sourceCard?: Card
): SpecialCardCheckResult {
  const victim = game.players.find((player) => player.id === victimId);
  const currentPlayer = game.players[game.currentPlayer];
  if (!victim) {
    return {};
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

    return {};
  }

  if (playedCard.value === "flip three") {
    game.flipCount = game.flipCount + 3;
    game.currentPlayer = game.players.findIndex(
      (player) => player.id === victimId
    );

    return {};
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

    return {};
  }

  if (playedCard.value === "flip four") {
    game.flipCount = game.flipCount + 4;
    game.currentPlayer = game.players.findIndex((p) => p.id === victimId);
    return {};
  }

  if (playedCard.value === "just one more") {
    game.flipCount = game.flipCount + 1;
    game.currentPlayer = game.players.findIndex((p) => p.id === victimId);
    victim.pendingJustOneMore = true;
    return {};
  }

  if (playedCard.value === "steal" && targetCard) {
    const cardIndex = victim.cards.findIndex(
      (c) => c.value === targetCard.value && c.type === targetCard.type
    );
    if (cardIndex !== -1) {
      const [stolen] = victim.cards.splice(cardIndex, 1);
      currentPlayer.cards.push(stolen);

      const stealCheck = checkPlayerHandAfterCardGain(game, currentPlayer, stolen);
      if (stealCheck === "flip7") {
        endRoundForActivePlayers(game);
      }

      if (game.flipCount === 1) {
        game.currentPlayer = getNextPlayerIndex(game);
      }
      return { stealCheck };
    }
    if (game.flipCount === 1) {
      game.currentPlayer = getNextPlayerIndex(game);
    }
    return {};
  }

  if (playedCard.value === "discard" && targetCard) {
    const cardIndex = victim.cards.findIndex(
      (c) => c.value === targetCard.value && c.type === targetCard.type
    );
    if (cardIndex !== -1) {
      victim.cards.splice(cardIndex, 1);
    }
    if (game.flipCount === 1) {
      game.currentPlayer = getNextPlayerIndex(game);
    }
    return {};
  }

  if (playedCard.value === "swap") {
    let swapCurrentPlayerCheck: SpecialCardCheckResult["swapCurrentPlayerCheck"];
    let swapVictimCheck: SpecialCardCheckResult["swapVictimCheck"];

    if (targetCard && sourceCard) {
      const victimCardIndex = victim.cards.findIndex(
        (c) => c.value === targetCard.value && c.type === targetCard.type
      );
      const attackerCardIndex = currentPlayer.cards.findIndex(
        (c) => c.value === sourceCard.value && c.type === sourceCard.type
      );
      if (victimCardIndex !== -1 && attackerCardIndex !== -1) {
        const [victimCard] = victim.cards.splice(victimCardIndex, 1);
        const [attackerCard] = currentPlayer.cards.splice(attackerCardIndex, 1);
        victim.cards.push(attackerCard);
        currentPlayer.cards.push(victimCard);

        // Check both players after the swap (card already in hand)
        swapCurrentPlayerCheck = checkPlayerHandAfterCardGain(game, currentPlayer, victimCard);
        swapVictimCheck = checkPlayerHandAfterCardGain(game, victim, attackerCard);

        if (swapCurrentPlayerCheck === "flip7" || swapVictimCheck === "flip7") {
          endRoundForActivePlayers(game);
        }
      }
    }

    if (game.flipCount === 1) {
      game.currentPlayer = getNextPlayerIndex(game);
    }
    return { swapCurrentPlayerCheck, swapVictimCheck };
  }

  return {};
}

export function getNextPlayerIndex(game: GameState): number {
  if (game.players.every((player) => player.status === "stop")) {
    if (game.status === "finished") {
      return 0;
    }
    const discardedCards: Card[] = [];
    game.players.forEach((player) => {
      discardedCards.push(...player.cards);
      player.cards = [];
      player.lastDrawnCard = null;
      player.status = "start";
    });
    game.discardPile = [...game.discardPile, ...discardedCards];
    game.round += 1;
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
  let specials: string[];
  let extraModifiers: string[] = [];
  let specialNumbers: string[] = [];

  if (game.mode === "vengeance") {
    specials = ["freeze", "flip three", "second chance", "flip four", "just one more", "steal", "discard", "swap"];
    extraModifiers = ["÷2"];
    specialNumbers = ["lucky 13", "unlucky 7"];
  } else if (game.mode === "custom" && game.customConfig) {
    specials = game.customConfig.enabledSpecials;
    extraModifiers = game.customConfig.enabledVengeanceModifiers;
    specialNumbers = game.customConfig.enabledSpecialNumbers;
  } else {
    specials = ["freeze", "flip three", "second chance"];
  }

  const topCard = game.discardPile.pop()!;
  specials.forEach((special) => {
    for (let i = 0; i < 3; i++) {
      game.discardPile.push({ value: special, type: "special" });
    }
  });
  extraModifiers.forEach((m) => game.discardPile.push({ value: m, type: "modifier" }));
  specialNumbers.forEach((n) => game.discardPile.push({ value: n, type: "number" }));
  game.deck = shuffle(game.discardPile);
  game.discardPile = [topCard];
}
