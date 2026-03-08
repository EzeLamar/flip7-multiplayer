import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import { createServer } from "http";
import { GameState, Card, Player } from "@/lib/types";
import {
  generateDeck,
  handleDrawNumberCard,
  handleDrawSpecialCard,
  handlePlaySpecialCard,
  handleScoreCards,
  getNextPlayerIndex,
  reshuffleDeck,
} from "./game-logic";

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
      lastEvent: null,
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

    const victim = game.players.find((p) => p.id === victimId);
    const freezePointsAdded =
      playedCard.value === "freeze" && victim
        ? handleScoreCards(victim.cards)
        : undefined;

    currentPlayer.cards.pop();

    handlePlaySpecialCard(game, victimId, playedCard);
    currentPlayer.lastDrawnCard = null;

    if (playedCard.value === "freeze") {
      game.lastEvent = { type: "freeze", targetName: victim?.name, sourceName: currentPlayer.name, pointsAdded: freezePointsAdded };
    } else if (playedCard.value === "flip three") {
      game.lastEvent = { type: "flip-three", targetName: victim?.name, sourceName: currentPlayer.name };
    } else if (playedCard.value === "second chance") {
      game.lastEvent = { type: "second-chance", targetName: victim?.name, sourceName: currentPlayer.name };
    }

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

    if (
      game.status === "finished" &&
      game.players.every((player) => player.status === "stop")
    ) {
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
    currentPlayer.lastDrawnCard = newCard;

    const scoreBeforeDraw = currentPlayer.score;
    switch (newCard.type) {
      case "number":
        callbackResponse.status = handleDrawNumberCard(
          game,
          currentPlayer,
          newCard
        );
        if (callbackResponse.status === "flip7") {
          game.lastEvent = { type: "flip7", targetName: currentPlayer.name, pointsAdded: currentPlayer.score - scoreBeforeDraw };
          // End the round immediately for all still-active players
          game.players.forEach((player) => {
            if (player.status === "dealing") {
              player.score += handleScoreCards(player.cards);
              player.status = "stop";
              player.secondChance = false;
            }
          });
          if (game.players.some((p) => p.score >= MAX_SCORE)) {
            game.status = "finished";
          }
          game.currentPlayer = getNextPlayerIndex(game);
        } else if (callbackResponse.status === "duplicates") {
          game.lastEvent = { type: "bust", targetName: currentPlayer.name };
          // Player busted: pass turn
          game.currentPlayer = getNextPlayerIndex(game);
        } else if (game.flipCount > 1) {
          // Inside a Flip Three sequence: decrement counter
          game.flipCount -= 1;
          if (game.flipCount === 1) {
            game.currentPlayer = getNextPlayerIndex(game);
          }
        } else {
          // Normal draw (including useSecondChance): one card per turn, pass turn
          game.currentPlayer = getNextPlayerIndex(game);
        }
        break;
      case "modifier":
        if (game.flipCount > 1) {
          game.flipCount -= 1;
          if (game.flipCount === 1) {
            game.currentPlayer = getNextPlayerIndex(game);
          }
        } else {
          // Normal draw: one card per turn, pass turn
          game.currentPlayer = getNextPlayerIndex(game);
        }
        break;
      case "special":
        handleDrawSpecialCard(currentPlayer, newCard);
        if (game.flipCount > 1) {
          game.flipCount -= 1;
          if (game.flipCount === 1) {
            game.currentPlayer = getNextPlayerIndex(game);
          }
        }
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

    const stopPointsAdded = handleScoreCards(currentPlayer.cards);
    currentPlayer.score = currentPlayer.score + stopPointsAdded;
    currentPlayer.status = "stop";

    if (currentPlayer.score >= MAX_SCORE) {
      game.status = "finished";
    }

    game.lastEvent = { type: "stop", targetName: currentPlayer.name, pointsAdded: stopPointsAdded };
    game.currentPlayer = getNextPlayerIndex(game);
    io.to(gameId).emit("gameStateUpdated", { gameState: game });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    // Handle player disconnection
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
