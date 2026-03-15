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
  const [showRules, setShowRules] = useState(false);
  const { socket, gameState, isCreatingRoom, createGame, joinGame, startGame } = useSocket();

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

  if (isCreatingRoom) {
    return (
      <div className="max-w-sm mx-auto animate-float-in">
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(168,85,247,0.3)",
            boxShadow: "0 0 30px rgba(168,85,247,0.15), inset 0 0 30px rgba(168,85,247,0.03)",
          }}
        >
          {/* Spinner + heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin" />
            <p className="text-purple-300 font-bold text-base tracking-wide">Creating your room…</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              The server is waking up — this can take up to a minute on first load.
              <br />
              <span className="text-yellow-400 font-medium">Please stay on this page!</span>
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Rules to read while waiting */}
          <p className="text-xs text-purple-400 font-semibold text-center tracking-widest uppercase">
            While you wait — how to play
          </p>

          <div className="space-y-3 text-xs text-gray-400">
            <div>
              <p className="text-purple-300 font-semibold mb-1">Objective</p>
              <p>Be the first player to reach 200 points across multiple rounds.</p>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">Your Turn</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Draw cards one at a time to build your hand.</li>
                <li>Press <span className="text-white font-medium">Stop</span> at any time to lock in your score.</li>
                <li>Drawing a <span className="text-red-400 font-medium">duplicate number</span> causes a bust — you score 0 this round.</li>
              </ul>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">FLIP 7</p>
              <p>Collect 7 <span className="text-white font-medium">different</span> number cards to trigger FLIP 7. You auto-stop and earn a <span className="text-yellow-300 font-medium">+15 bonus</span>.</p>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">Card Types</p>
              <ul className="space-y-1">
                <li><span className="text-white font-medium">Number cards (0–12)</span> — face value added to your score.</li>
                <li><span className="text-green-400 font-medium">+2 / +4 / +6 / +8 / +10</span> — add that amount to your total.</li>
                <li><span className="text-yellow-300 font-medium">x2</span> — doubles your number-card subtotal.</li>
              </ul>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">Special Cards</p>
              <ul className="space-y-1">
                <li><span className="text-cyan-400 font-medium">❄️ Freeze</span> — force a target to stop immediately.</li>
                <li><span className="text-orange-400 font-medium">🎴 Flip Three</span> — force a target to draw 3 cards now.</li>
                <li><span className="text-pink-400 font-medium">💖 Second Chance</span> — saves a player from their next bust.</li>
              </ul>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">Scoring Order</p>
              <ol className="space-y-0.5 list-decimal list-inside">
                <li>Sum all number cards.</li>
                <li>Apply x2 if held.</li>
                <li>Add all +X modifier cards.</li>
                <li>Add +15 if FLIP 7 was achieved.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
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

        {/* Game rules hint + expandable how-to-play */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Collect cards without duplicates • 7 unique numbers = FLIP7! • First to 200 pts wins
          </p>
          <button
            onClick={() => setShowRules((s) => !s)}
            className="mt-2 w-full text-xs text-purple-400 hover:text-purple-300 transition-colors text-center"
          >
            {showRules ? "Hide rules ▲" : "How to play ▼"}
          </button>

          {showRules && (
            <div className="mt-3 space-y-3 text-xs text-gray-400">
              {/* Objective */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">Objective</p>
                <p>Be the first player to reach 200 points across multiple rounds.</p>
              </div>

              {/* Turn structure */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">Your Turn</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Draw cards one at a time to build your hand.</li>
                  <li>Press <span className="text-white font-medium">Stop</span> at any time to lock in your score for the round.</li>
                  <li>Drawing a <span className="text-red-400 font-medium">duplicate number</span> causes a bust — you lose all cards and score 0 this round.</li>
                </ul>
              </div>

              {/* FLIP 7 */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">FLIP 7</p>
                <p>Collect 7 <span className="text-white font-medium">different</span> number cards to trigger FLIP 7. You automatically stop and earn a <span className="text-yellow-300 font-medium">+15 bonus</span> on top of your card total.</p>
              </div>

              {/* Card types */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">Card Types</p>
                <ul className="space-y-1">
                  <li><span className="text-white font-medium">Number cards (0–12)</span> — contribute their face value to your score.</li>
                  <li><span className="text-green-400 font-medium">+2 / +4 / +6 / +8 / +10</span> — add that amount to your total score.</li>
                  <li><span className="text-yellow-300 font-medium">x2</span> — doubles your number-card subtotal before additive modifiers are applied.</li>
                </ul>
              </div>

              {/* Special cards */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">Special Cards</p>
                <ul className="space-y-1">
                  <li><span className="text-cyan-400 font-medium">❄️ Freeze</span> — force a target player to stop immediately, locking their current score.</li>
                  <li><span className="text-orange-400 font-medium">🎴 Flip Three</span> — force a target player to draw 3 additional cards right now.</li>
                  <li><span className="text-pink-400 font-medium">💖 Second Chance</span> — give a player a safety net: if they would bust on their next duplicate, the duplicate and this card are discarded instead of losing everything.</li>
                </ul>
              </div>

              {/* Scoring */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">Scoring Order</p>
                <ol className="space-y-0.5 list-decimal list-inside">
                  <li>Sum all number cards.</li>
                  <li>Apply x2 if held (doubles the number total).</li>
                  <li>Add all +X modifier cards.</li>
                  <li>Add +15 if FLIP 7 was achieved.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
