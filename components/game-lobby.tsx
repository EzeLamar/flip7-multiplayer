"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GameBoard } from "@/components/game-board";
import { useSocket } from "@/hooks/use-socket";

export function GameLobby() {
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [view, setView] = useState<"join" | "create" | "game">("join");
  const { socket, gameState, createGame, joinGame, startGame } = useSocket();

  const handleCreateGame = () => {
    if (!playerName) return;
    createGame(playerName);
    setView("game");
  };

  const handleJoinGame = () => {
    if (!playerName || !gameId) return;
    joinGame(gameId, playerName);
    setView("game");
  };

  if (view === "game" && gameState && socket) {
    return <GameBoard gameState={gameState} socket={socket} />;
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6 bg-white/90 backdrop-blur-sm">
        <div className="space-y-4">
          <Input
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full"
          />

          {view === "join" ? (
            <>
              <Input
                placeholder="Enter game code"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleJoinGame} className="w-full">
                Join Game
              </Button>
              <Button
                variant="outline"
                onClick={() => setView("create")}
                className="w-full"
              >
                Create New Game
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCreateGame} className="w-full">
                Create Game
              </Button>
              <Button
                variant="outline"
                onClick={() => setView("join")}
                className="w-full"
              >
                Join Existing Game
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
