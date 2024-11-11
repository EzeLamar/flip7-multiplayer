import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import { createServer } from "http";
import { GameState, Card, Player } from "@/lib/types";

const NEXT_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: NEXT_URL,
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
      status: "start",
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
      status: "start",
      score: 0,
    };

    game.players.push(player);
    socket.join(gameId);
    io.to(gameId).emit("playerJoined", { gameState: game });

    if (game.players.length >= 2) {
      game.status = "ready";
      io.to(gameId).emit("gameReady", { gameState: game });
    }
  });

  socket.on("startGame", (gameId: string) => {
    const game = games.get(gameId);
    if (!game) return;

    game.status = "playing";
    game.discardPile = [game.deck.pop()!];
    io.to(gameId).emit("gameStarted", { gameState: game });
  });

  // socket.on("playCard", ({ gameId, cardIndex }) => {
  //   const game = games.get(gameId);
  //   if (!game) return;

  //   const currentPlayer = game.players[game.currentPlayer];
  //   if (currentPlayer.id !== socket.id) return;

  //   const card = currentPlayer.cards[cardIndex];
  //   const topCard = game.discardPile[game.discardPile.length - 1];

  //   if (isValidPlay(card, topCard)) {
  //     currentPlayer.cards.splice(cardIndex, 1);
  //     game.discardPile.push(card);

  //     if (currentPlayer.cards.length === 0) {
  //       game.status = "finished";
  //       io.to(gameId).emit("gameOver", { winner: currentPlayer });
  //     } else {
  //       handleSpecialCard(game, card);
  //       game.currentPlayer = getNextPlayerIndex(game);
  //       io.to(gameId).emit("gameStateUpdated", { gameState: game });
  //     }
  //   }
  // });

  socket.on("drawCard", (gameId: string) => {
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

    if (currentPlayer.status === "start") {
      currentPlayer.status = "dealing";
      currentPlayer.cards = [];
    }

    if (game.deck.length === 0) {
      reshuffleDeck(game);
    }

    const newCard = game.deck.pop()!;
    if (
      currentPlayer.cards
        .filter((card) => card.type === "number")
        .find((card) => card.value === newCard.value)
    ) {
      currentPlayer.status = "stop";
    }

    currentPlayer.cards.push(newCard);

    if (
      currentPlayer.cards.filter((card) => card.type === "number").length === 7
    ) {
      currentPlayer.status = "stop";
      currentPlayer.score = handleScoreCards(currentPlayer.cards) + 15;
    }

    game.currentPlayer = getNextPlayerIndex(game);
    io.to(gameId).emit("gameStateUpdated", { gameState: game });
  });

  socket.on("stopDrawCard", (gameId: string) => {
    const game = games.get(gameId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayer];
    if (currentPlayer.id !== socket.id) return;

    currentPlayer.score =
      currentPlayer.score + handleScoreCards(currentPlayer.cards);
    currentPlayer.status = "stop";

    game.currentPlayer = getNextPlayerIndex(game);
    io.to(gameId).emit("gameStateUpdated", { gameState: game });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Handle player disconnection
  });
});

function generateDeck(): Card[] {
  const numbers = Array.from({ length: 12 }, (_, i) => i.toString());
  const specials = ["+8", "+10", "x2", "freeze"];
  const deck: Card[] = [];

  deck.push({ value: "0", type: "number" });
  numbers.forEach((number) => {
    for (let i = 0; i < parseInt(number); i++) {
      deck.push({ value: number, type: "number" });
    }
  });
  // specials.forEach(special => {
  //   deck.push({ value: special, type: 'special' });
  //   deck.push({ value: special, type: 'special' });
  // });

  // Add wild cards
  // for (let i = 0; i < 4; i++) {
  //   deck.push({ color: 'black', value: 'wild', type: 'wild' });
  //   deck.push({ color: 'black', value: 'wild4', type: 'wild' });
  // }

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

function isValidPlay(card: Card, topCard: Card): boolean {
  if (card.type === "wild") return true;
  return card.color === topCard.color || card.value === topCard.value;
}

function handleSpecialCard(game: GameState, card: Card) {
  switch (card.value) {
    case "skip":
      game.currentPlayer = getNextPlayerIndex(game);
      break;
    case "reverse":
      game.direction *= -1;
      break;
    case "draw2":
      const nextPlayer = game.players[getNextPlayerIndex(game)];
      for (let i = 0; i < 2; i++) {
        if (game.deck.length === 0) reshuffleDeck(game);
        nextPlayer.cards.push(game.deck.pop()!);
      }
      break;
    case "wild4":
      const nextPlayerWild4 = game.players[getNextPlayerIndex(game)];
      for (let i = 0; i < 4; i++) {
        if (game.deck.length === 0) reshuffleDeck(game);
        nextPlayerWild4.cards.push(game.deck.pop()!);
      }
      break;
  }
}

function handleScoreCards(cards: Card[]): number {
  let score = 0;
  const numberCards = cards.filter((card) => card.type === "number");
  const specialCards = cards.filter((card) => card.type === "special");
  numberCards.forEach((card) => {
    score += parseInt(card.value);
  });
  specialCards.forEach((card) => {
    score += card.value === "+8" ? 8 : card.value === "+10" ? 10 : 2;
  });

  return score;
}

function getNextPlayerIndex(game: GameState): number {
  if (!game.players.find((player) => player.status === "dealing")) {
    const discardedCards: Card[] = [];
    game.players.forEach((player) => {
      discardedCards.push(...player.cards);
      player.status = "start";
    });
    game.discardPile = [...game.discardPile, ...discardedCards];
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

httpServer.listen(3001, () => {
  console.log(`Socket.IO server running on ${SOCKET_URL}`);
});
