import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import { createServer } from "http";
import { GameState, Card, Player, PlayerHandStatus } from "@/lib/types";

const NEXT_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
const PORT = process.env.BACKEND_PORT ?? "3001";
const MAX_SCORE = 200;

const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h1>Socket.IO server for Flip7</h1>");
});
const io = new Server(httpServer, {
  cors: {
    origin: "*", //Enable CORS for Testing
    methods: ["GET", "POST"],
  },
});

const games = new Map<string, GameState>();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("createGame", (playerName: string) => {
    const gameId = Math.random().toString(36).substring(2, 8);
    const player: Player = {
      id: socket.id,
      name: playerName,
      cards: [],
      lastDrawnCard: null,
      status: "start",
      secondChance: false,
      score: 0,
    };

    const gameState: GameState = {
      id: gameId,
      players: [player],
      currentPlayer: 0,
      deck: generateDeck(),
      discardPile: [],
      direction: 1,
      status: "waiting",
      flipCount: 1,
      round: 1,
    };

    games.set(gameId, gameState);
    socket.join(gameId);
    socket.emit("gameCreated", { gameId, gameState });
  });

  socket.on("joinGame", ({ gameId, playerName }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit("error", "Game not found");
      return;
    }

    if (game.status !== "waiting") {
      socket.emit("error", "Game already started");
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      cards: [],
      lastDrawnCard: null,
      status: "start",
      secondChance: false,
      score: 0,
    };

    game.players.push(player);
    socket.join(gameId);
    // io.to(gameId).emit("playerJoined", { gameState: game });

    // if (game.players.length >= 2) {
    //   game.status = "ready";
    //   io.to(gameId).emit("gameReady", { gameState: game });
    // }

    // Update the gameState object to include the new player's information
    const updatedGameState = {
      ...game,
      players: game.players,
    };

    io.to(gameId).emit("gameStateUpdated", { gameState: updatedGameState });
  });

  socket.on("startGame", (gameId: string) => {
    const game = games.get(gameId);
    if (!game) return;

    game.status = "playing";
    game.discardPile = [game.deck.pop()!];
    io.to(gameId).emit("gameStarted", { gameState: game });
  });

  socket.on("playCard", ({ gameId, victimId, playedCard }) => {
    const game = games.get(gameId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayer];
    if (currentPlayer.id !== socket.id) return;

    currentPlayer.cards.pop();

    handlePlaySpecialCard(game, victimId, playedCard);
    currentPlayer.lastDrawnCard = null;
    io.to(gameId).emit("gameStateUpdated", { gameState: game });
  });

  socket.on("drawCard", (gameId: string, callback) => {
    const callbackResponse = { status: "dealing" };
    const game = games.get(gameId);
    if (!game) {
      return;
    }

    const currentPlayer = game.players[game.currentPlayer];
    if (currentPlayer.id !== socket.id) {
      return;
    }

    if (currentPlayer.status === "stop") {
      return;
    }

    if (game.status === "finished" && game.players.every((player => player.status === "stop"))) {
      return
    }

    if (currentPlayer.status === "start") {
      currentPlayer.status = "dealing";
      currentPlayer.cards = [];
    }

    if (game.deck.length === 0) {
      reshuffleDeck(game);
    }

    const newCard = game.deck.pop()!;
    currentPlayer.lastDrawnCard = newCard;

    switch(newCard.type) {
      case "number":
        callbackResponse.status = handleDrawNumberCard(game, currentPlayer, newCard);
      case "modifier":
        if (game.flipCount > 1) {
          game.flipCount = game.flipCount - 1;
        }
        else {
          game.currentPlayer = getNextPlayerIndex(game);
        }
        break;
      case "special":
        handleDrawSpecialCard(currentPlayer, newCard);
        callbackResponse.status = "special";
        break;
      default:
        break;
    }

    currentPlayer.cards.push(newCard);

    io.to(gameId).emit("gameStateUpdated", { gameState: game });

    callback(callbackResponse);
  });

  socket.on("stopDrawCard", (gameId: string) => {
    const game = games.get(gameId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayer];
    if (currentPlayer.id !== socket.id) return;

    currentPlayer.score =
      currentPlayer.score + handleScoreCards(currentPlayer.cards);
    currentPlayer.status = "stop";
     
    if (currentPlayer.score >= MAX_SCORE) {
      game.status = "finished";
    }

    game.currentPlayer = getNextPlayerIndex(game);
    io.to(gameId).emit("gameStateUpdated", { gameState: game });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Handle player disconnection
  });
});


function handlePlaySpecialCard(game: GameState, victimId: string, playedCard: Card) {
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
    if (currentPlayer.score >= MAX_SCORE) {
      game.status = "finished";
    }

    game.currentPlayer = getNextPlayerIndex(game);
    
    return;
  }

  if (playedCard.value === "flip three") {
    game.flipCount = game.flipCount + 3;
    game.currentPlayer = game.players.findIndex((player) => player.id === victimId);

    return;
  }

  if (playedCard.value === "second chance") {
    victim.secondChance = true;
    if (game.flipCount === 1) {
      game.currentPlayer = getNextPlayerIndex(game);
    }
    
    return;
  }
}

function handleDrawNumberCard(game: GameState, player: Player, newCard: Card) : PlayerHandStatus {
  if (
    player.cards
      .filter((card) => card.type === "number")
      .find((card) => card.value === newCard.value)
  ) {
    if (player.secondChance) {  
      const firstRepeatedCardIndex = player.cards.findIndex((card) => card.value === newCard.value);
      player.cards.splice(firstRepeatedCardIndex, 1);
      const secondChanceCardIndex = player.cards.findIndex((card) => card.value === "second chance");
      player.cards.splice(secondChanceCardIndex, 1);
      player.secondChance = false;
      return "normal";
    }

    player.status = "stop";
    game.flipCount = 1;
    return "duplicates";
  }

  if (
    player.cards.filter((card) => card.type === "number").length === 7
  ) {
    player.status = "stop";
    game.flipCount = 1;
    player.score = player.score + handleScoreCards(player.cards) + 15;
    return "flip7";
  }

  return "normal";
}

function handleDrawSpecialCard(player: Player, newCard: Card) {
  return;
}

function generateDeck(): Card[] {
  const numbers = Array.from({ length: 12 }, (_, i) => i.toString());
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

function shuffle(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function dealInitialCards(game: GameState) {
  game.players.forEach((player) => {
    player.cards = game.deck.splice(0, 7);
  });
}

function handleScoreCards(cards: Card[]): number {
  let score = 0;
  const numberCards = cards.filter((card) => card.type === "number");
  const modifierCards = cards.filter((card) => card.type === "modifier");
  numberCards.forEach((card) => {
    score += parseInt(card.value);
  });
  modifierCards.forEach((card) => {
    switch (card.value) {
      case "x2":
        score *= 2;
        break;
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

function getNextPlayerIndex(game: GameState): number {
  if (game.status === "finished") {
    return 0;
  }

  if (!game.players.find((player) => player.status === "dealing")) {
    const discardedCards: Card[] = [];
    game.players.forEach((player) => {
      discardedCards.push(...player.cards);
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

  const nextPlayerIndex =
    (currentPlayerDealingIndex + game.direction) % dealingPlayerIndices.length;
  return dealingPlayerIndices[nextPlayerIndex];
}

function reshuffleDeck(game: GameState) {
  const topCard = game.discardPile.pop()!;
  game.deck = shuffle(game.discardPile);
  game.discardPile = [topCard];
}

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
