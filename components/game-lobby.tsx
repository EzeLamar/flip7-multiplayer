"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameBoard } from "@/components/game-board";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

/** Milliseconds between each loading message transition. */
const LOADING_MESSAGE_INTERVAL_MS = 2500;

export function GameLobby() {
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [view, setView] = useState<"join" | "create" | "local" | "game">("join");
  const [showRules, setShowRules] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [localPlayerNames, setLocalPlayerNames] = useState<string[]>(["", ""]);
  const { socket, gameState, isCreatingRoom, createGame, createLocalGame, joinGame, startGame, resetGame } = useSocket();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isCreatingRoom) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % t.loadingMessages.length);
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isCreatingRoom, t.loadingMessages.length]);

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

  const handleStartLocalGame = () => {
    const names = localPlayerNames.map((n) => n.trim()).filter(Boolean);
    if (names.length < 2) return;
    createLocalGame(names);
    setView("game");
  };

  const handleRestartGame = () => {
    resetGame();
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
            <p className="text-purple-300 font-bold text-base tracking-wide">
              {t.loadingMessages[loadingMsgIndex]}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t.loadingWakingUp}
              <br />
              <span className="text-yellow-400 font-medium">{t.loadingStayOnPage}</span>
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Rules to read while waiting */}
          <p className="text-xs text-purple-400 font-semibold text-center tracking-widest uppercase">
            {t.whileYouWait}
          </p>

          <div className="space-y-3 text-xs text-gray-400">
            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.objective}</p>
              <p>{t.objectiveText}</p>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.yourTurn}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t.yourTurnItems[0] as string}</li>
                <li>
                  {(t.yourTurnItems[1] as string[])[0]}
                  <span className="text-white font-medium">{(t.yourTurnItems[1] as string[])[1]}</span>
                  {(t.yourTurnItems[1] as string[])[2]}
                </li>
                <li>
                  {(t.yourTurnItems[2] as string[])[0]}
                  <span className="text-red-400 font-medium">{(t.yourTurnItems[2] as string[])[1]}</span>
                  {(t.yourTurnItems[2] as string[])[2]}
                </li>
              </ul>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.flip7Title}</p>
              <p>
                {t.flip7Text[0]}
                <span className="text-white font-medium">{t.flip7Text[1]}</span>
                {t.flip7Text[2]}
                <span className="text-yellow-300 font-medium">{t.flip7Text[3]}</span>
                {t.flip7Text[4]}
              </p>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.cardTypes}</p>
              <ul className="space-y-1">
                {(t.cardTypeItems as string[][]).map((item, i) => (
                  <li key={i}>
                    <span className={i === 0 ? "text-white font-medium" : i === 1 ? "text-green-400 font-medium" : "text-yellow-300 font-medium"}>
                      {item[0]}
                    </span>
                    {item[1]}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.specialCards}</p>
              <ul className="space-y-1">
                {(t.specialCardItems as string[][]).map((item, i) => (
                  <li key={i}>
                    <span className={i === 0 ? "text-cyan-400 font-medium" : i === 1 ? "text-orange-400 font-medium" : "text-pink-400 font-medium"}>
                      {item[0]}
                    </span>
                    {item[1]}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.scoringOrder}</p>
              <ol className="space-y-0.5 list-decimal list-inside">
                {(t.scoringItems as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
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
            {view === "join" ? t.joinGame : view === "create" ? t.createGame : t.localPlayersTitle}
          </span>
        </div>

        {view === "local" ? (
          /* ── Local Multiplayer: player name list ── */
          <div className="space-y-3">
            {localPlayerNames.map((name, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder={`${t.yourName} ${i + 1}`}
                  value={name}
                  onChange={(e) => {
                    const updated = [...localPlayerNames];
                    updated[i] = e.target.value;
                    setLocalPlayerNames(updated);
                  }}
                  className={cn(
                    "flex-1 bg-white/10 border-purple-500/40 text-white placeholder:text-gray-500",
                    "focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40",
                    "rounded-xl h-11 text-base"
                  )}
                />
                {localPlayerNames.length > 2 && (
                  <button
                    onClick={() =>
                      setLocalPlayerNames(localPlayerNames.filter((_, idx) => idx !== i))
                    }
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    {t.removePlayer}
                  </button>
                )}
              </div>
            ))}

            {localPlayerNames.length < 8 && (
              <button
                onClick={() => setLocalPlayerNames([...localPlayerNames, ""])}
                className="w-full text-sm text-purple-400 hover:text-purple-300 transition-colors border border-dashed border-purple-500/30 rounded-xl py-2 hover:border-purple-400/50"
              >
                {t.addPlayer}
              </button>
            )}

            <Button
              onClick={handleStartLocalGame}
              disabled={localPlayerNames.filter((n) => n.trim()).length < 2}
              className={cn(
                "w-full h-12 text-base font-bold rounded-xl transition-all duration-200",
                "bg-gradient-to-r from-green-600 to-teal-600",
                "hover:from-green-500 hover:to-teal-500",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
              )}
            >
              🎮 {t.startLocalGame}
            </Button>

            <Button
              variant="outline"
              onClick={() => setView("join")}
              className={cn(
                "w-full h-10 text-sm font-semibold rounded-xl transition-all duration-200",
                "border-purple-500/40 text-purple-300 bg-transparent",
                "hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-200"
              )}
            >
              {t.backToMenu}
            </Button>
          </div>
        ) : (
          <>
            <Input
              placeholder={t.yourName}
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
                  placeholder={t.gameCode}
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
                  {t.joinGameBtn}
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
                  {t.createNewGame}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView("local")}
                  className={cn(
                    "w-full h-12 text-base font-semibold rounded-xl transition-all duration-200",
                    "border-green-500/40 text-green-300 bg-transparent",
                    "hover:bg-green-500/20 hover:border-green-400 hover:text-green-200"
                  )}
                >
                  🎮 {t.localMultiplayer}
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
                  {t.createGameBtn}
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
                  {t.joinExistingGame}
                </Button>
              </>
            )}
          </>
        )}

        {/* Game rules hint + expandable how-to-play */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            {t.gameHint}
          </p>
          <button
            onClick={() => setShowRules((s) => !s)}
            className="mt-2 w-full text-xs text-purple-400 hover:text-purple-300 transition-colors text-center"
          >
            {showRules ? t.hideRules : t.howToPlay}
          </button>

          {showRules && (
            <div className="mt-3 space-y-3 text-xs text-gray-400">
              {/* Objective */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.objective}</p>
                <p>{t.objectiveText}</p>
              </div>

              {/* Turn structure */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.yourTurn}</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t.yourTurnItems[0] as string}</li>
                  <li>
                    {(t.yourTurnItems[1] as string[])[0]}
                    <span className="text-white font-medium">{(t.yourTurnItems[1] as string[])[1]}</span>
                    {(t.yourTurnItems[1] as string[])[2]}
                  </li>
                  <li>
                    {(t.yourTurnItems[2] as string[])[0]}
                    <span className="text-red-400 font-medium">{(t.yourTurnItems[2] as string[])[1]}</span>
                    {(t.yourTurnItems[2] as string[])[2]}
                  </li>
                </ul>
              </div>

              {/* FLIP 7 */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.flip7Title}</p>
                <p>
                  {t.flip7Text[0]}
                  <span className="text-white font-medium">{t.flip7Text[1]}</span>
                  {t.flip7Text[2]}
                  <span className="text-yellow-300 font-medium">{t.flip7Text[3]}</span>
                  {t.flip7Text[4]}
                </p>
              </div>

              {/* Card types */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.cardTypes}</p>
                <ul className="space-y-1">
                  {(t.cardTypeItems as string[][]).map((item, i) => (
                    <li key={i}>
                      <span className={i === 0 ? "text-white font-medium" : i === 1 ? "text-green-400 font-medium" : "text-yellow-300 font-medium"}>
                        {item[0]}
                      </span>
                      {item[1]}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Special cards */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.specialCards}</p>
                <ul className="space-y-1">
                  {(t.specialCardItems as string[][]).map((item, i) => (
                    <li key={i}>
                      <span className={i === 0 ? "text-cyan-400 font-medium" : i === 1 ? "text-orange-400 font-medium" : "text-pink-400 font-medium"}>
                        {item[0]}
                      </span>
                      {item[1]}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scoring */}
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.scoringOrder}</p>
                <ol className="space-y-0.5 list-decimal list-inside">
                  {(t.scoringItems as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
