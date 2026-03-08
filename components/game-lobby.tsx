"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameBoard } from "@/components/game-board";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";

export function GameLobby() {
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [view, setView] = useState<"join" | "create" | "game">("join");
  const { socket, gameState, createGame, joinGame, startGame } = useSocket();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setGameId(roomParam);
      setView("join");
    }
  }, []);

  const handleCreateGame = () => {
    if (!playerName) return;
    createGame(playerName);
    setView("game");
  };

  const handleRestartGame = () => {
    setView("join");
  };

  const handleJoinGame = () => {
    if (!playerName || !gameId) return;
    joinGame(gameId, playerName);
    setView("game");
  };

  if (view === "game" && gameState && socket) {
    return <GameBoard gameState={gameState} socket={socket} handleRestartGame={handleRestartGame} />;
  }

  return (
    <div className="max-w-sm mx-auto animate-float-in">
      {/* Neon card container */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(168,85,247,0.3)",
          boxShadow: "0 0 30px rgba(168,85,247,0.15), inset 0 0 30px rgba(168,85,247,0.03)",
        }}
      >
        {/* Section heading */}
        <div className="text-center mb-2">
          <span className="text-xs tracking-[0.2em] uppercase text-purple-400 font-semibold">
            {view === "join" ? "Join a Game" : "Create a Game"}
          </span>
        </div>

        <Input
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className={cn(
            "w-full bg-white/10 border-purple-500/40 text-white placeholder:text-gray-500",
            "focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40",
            "rounded-xl h-12 text-base"
          )}
        />

        {view === "join" ? (
          <>
            <Input
              placeholder="Game code"
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              className={cn(
                "w-full bg-white/10 border-purple-500/40 text-white placeholder:text-gray-500",
                "focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40",
                "rounded-xl h-12 text-base font-mono tracking-widest"
              )}
            />
            <Button
              onClick={handleJoinGame}
              disabled={!playerName || !gameId}
              className={cn(
                "w-full h-12 text-base font-bold rounded-xl transition-all duration-200",
                "bg-gradient-to-r from-purple-600 to-pink-600",
                "hover:from-purple-500 hover:to-pink-500",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
              )}
            >
              Join Game
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("create")}
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl transition-all duration-200",
                "border-purple-500/40 text-purple-300 bg-transparent",
                "hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-200"
              )}
            >
              Create New Game
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleCreateGame}
              disabled={!playerName}
              className={cn(
                "w-full h-12 text-base font-bold rounded-xl transition-all duration-200",
                "bg-gradient-to-r from-purple-600 to-pink-600",
                "hover:from-purple-500 hover:to-pink-500",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
              )}
            >
              Create Game
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("join")}
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl transition-all duration-200",
                "border-purple-500/40 text-purple-300 bg-transparent",
                "hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-200"
              )}
            >
              Join Existing Game
            </Button>
          </>
        )}

        {/* Game rules hint */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Collect cards without duplicates • 7 unique numbers = FLIP7! • First to 200 pts wins
          </p>
        </div>
      </div>
    </div>
  );
}
