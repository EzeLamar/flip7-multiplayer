"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {
  Card,
  Card as CardType,
  GameState,
  LastEvent,
  Player,
  PlayerHandStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlayerInfo } from "@/components/ui/gamerInfo";
import { cn } from "@/lib/utils";
import { soundMappings, SoundKey } from "@/utils/soundMappings";
import { Copy, Users } from "lucide-react";

interface GameBoardProps {
  gameState: GameState;
  socket: Socket;
  handleRestartGame: () => void;
}

const EVENT_CONFIG: Record<
  LastEvent["type"],
  { emoji: string; label: (e: LastEvent) => string; bg: string; border: string; glow: string }
> = {
  freeze: {
    emoji: "❄️",
    label: (e) => `${e.targetName} was FROZEN by ${e.sourceName}!`,
    bg: "bg-blue-900/80",
    border: "border-cyan-400/60",
    glow: "shadow-[0_0_40px_rgba(6,182,212,0.5)]",
  },
  "flip-three": {
    emoji: "🎴",
    label: (e) => `${e.targetName} must draw 3 cards!`,
    bg: "bg-orange-900/80",
    border: "border-orange-400/60",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.5)]",
  },
  "second-chance": {
    emoji: "💖",
    label: (e) => `${e.targetName} got Second Chance!`,
    bg: "bg-pink-900/80",
    border: "border-pink-400/60",
    glow: "shadow-[0_0_40px_rgba(236,72,153,0.5)]",
  },
  bust: {
    emoji: "💥",
    label: (e) => `${e.targetName} BUSTED!`,
    bg: "bg-red-900/80",
    border: "border-red-400/60",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.6)]",
  },
  flip7: {
    emoji: "🌈",
    label: (e) => `${e.targetName} got FLIP 7! +15 bonus!`,
    bg: "bg-purple-900/80",
    border: "border-purple-400/60",
    glow: "shadow-[0_0_50px_rgba(168,85,247,0.7)]",
  },
  stop: {
    emoji: "🛑",
    label: (e) => `${e.targetName} stopped drawing!`,
    bg: "bg-gray-900/80",
    border: "border-teal-400/60",
    glow: "shadow-[0_0_30px_rgba(20,184,166,0.4)]",
  },
};

export function GameBoard({
  gameState,
  socket,
  handleRestartGame,
}: GameBoardProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<SoundKey | null>(null);
  const [broadcastEvent, setBroadcastEvent] = useState<LastEvent | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevLastEventRef = useRef<LastEvent | null>(null);
  const broadcastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGameFinished =
    gameState.status === "finished" &&
    gameState.players.every((p) => p.status === "stop");
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const thisPlayer = gameState.players.find(
    (player) => player.id === socket.id
  );
  const isCurrentPlayer = currentPlayer?.id === socket.id;

  // Detect lastEvent changes and trigger broadcast overlay
  useEffect(() => {
    const newEvent = gameState.lastEvent;
    const prevEvent = prevLastEventRef.current;

    if (
      newEvent &&
      (prevEvent === null ||
        prevEvent.type !== newEvent.type ||
        prevEvent.targetName !== newEvent.targetName ||
        prevEvent.sourceName !== newEvent.sourceName)
    ) {
      if (broadcastTimeoutRef.current) {
        clearTimeout(broadcastTimeoutRef.current);
      }
      setBroadcastEvent(newEvent);
      broadcastTimeoutRef.current = setTimeout(() => {
        setBroadcastEvent(null);
      }, 2500);
    }

    prevLastEventRef.current = newEvent;
  }, [gameState.lastEvent]);

  const handlePlayCard = (cardIndex: number) => {
    if (!isCurrentPlayer) return;

    const card = currentPlayer.cards[cardIndex];
    if (card.type === "special") {
      setSelectedCard(card);
    }
  };

  const handleDrawCard = () => {
    if (!isCurrentPlayer) {
      return;
    }

    const idPlayer = currentPlayer.id;

    if (gameState.flipCount > 1) {
      playSound("useFlip3");
    } else {
      playSound("draw");
    }
    setIsLoading(true);
    socket.emit(
      "drawCard",
      gameState.id,
      (response: { status: PlayerHandStatus }) => {
        setIsLoading(false);
        if (response.status === "useSecondChance") {
          playSound("useSecondChance");
        }
        if (response.status === "duplicates") {
          playSound("duplicates");
        }
        if (response.status === "flip7") {
          playSound("flip7");
        }
        if (response.status === "special") {
          playSound("special");
        }
      }
    );
  };

  useEffect(() => {
    const handleGameStateUpdated = ({ gameState: updatedGameState }: { gameState: GameState }) => {
      if (updatedGameState.id === gameState.id) {
        setIsLoading(false);
      }
    };

    socket.on("gameStateUpdated", handleGameStateUpdated);

    return () => {
      socket.off("gameStateUpdated", handleGameStateUpdated);
    };
  }, [socket, gameState.id]);

  const handleStopDrawCard = () => {
    if (!isCurrentPlayer) return;

    playSound("stop");
    socket.emit("stopDrawCard", gameState.id);
  };

  const handleCopyInviteLink = () => {
    const url =
      window.location.origin +
      window.location.pathname +
      "?room=" +
      gameState.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Invite link copied! Share it to invite players.");
      });
    } else {
      toast.error("Copy not supported — room code: " + gameState.id);
    }
  };

  const selectSpecialCardVictim = (player: Player, playedCard: Card) => {
    socket.emit("playCard", {
      gameId: gameState.id,
      victimId: player.id,
      playedCard,
    });
    switch (playedCard.value) {
      case "freeze":
        playSound("useFreeze");
        break;
      case "flip three":
        playSound("useFlip3");
        break;
      case "second chance":
        playSound("getSecondChance");
        break;
      default:
        break;
    }
    setSelectedCard(null);
  };

  const blockStopButton = () => {
    if (gameState.flipCount > 1) {
      return true;
    }

    if (!isCurrentPlayer || currentPlayer.lastDrawnCard?.type === "special") {
      return true;
    }

    if (currentPlayer.status === "start") {
      return true;
    }

    const cardValues = currentPlayer.cards.map((card) => card.value);
    const hasDuplicates = cardValues.some(
      (value, index) => cardValues.indexOf(value) !== index
    );
    if (hasDuplicates) {
      return true;
    }

    return false;
  };

  const isDisablePlayerButtonSelection = (player: Player, card: Card) => {
    if (player.status === "stop") {
      return true;
    }

    if (card.value === "second chance" && player.secondChance) {
      if (gameState.players.every((p) => p.secondChance)) {
        return false;
      }
      return true;
    }
  };

  const playSound = (soundKey: SoundKey) => {
    if (audioRef.current) {
      audioRef.current.src = soundMappings[soundKey];
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(soundKey);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(null);
  };

  useEffect(() => {
    if (isGameFinished) {
      const winner = gameState.players.find((p) => p.cards.length === 0);
      if (winner) {
        toast.success(`${winner.name} wins the game!`);
      }
      playSound("win");
    }
  }, [gameState.players, isGameFinished]);

  if (!thisPlayer) {
    return;
  }

  const sortedScoreboard = gameState.players
    .slice()
    .sort((a, b) => b.score - a.score);

  const rankColors = ["text-yellow-300", "text-gray-300", "text-amber-600"];
  const rankEmojis = ["🥇", "🥈", "🥉"];

  return (
    <div className="container max-w-4xl mx-auto px-3 pb-6">
      {/* Power-up Broadcast Overlay */}
      {broadcastEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Background tint */}
          <div className={cn(
            "absolute inset-0 opacity-20",
            broadcastEvent.type === "bust" ? "bg-red-900" :
            broadcastEvent.type === "flip7" ? "bg-purple-900" :
            broadcastEvent.type === "freeze" ? "bg-blue-900" :
            broadcastEvent.type === "flip-three" ? "bg-orange-900" :
            broadcastEvent.type === "second-chance" ? "bg-pink-900" :
            "bg-gray-900"
          )} />
          {/* Event card */}
          <div
            className={cn(
              "relative rounded-3xl px-8 py-6 text-center animate-event-popup",
              "backdrop-blur-xl border-2",
              EVENT_CONFIG[broadcastEvent.type].bg,
              EVENT_CONFIG[broadcastEvent.type].border,
              EVENT_CONFIG[broadcastEvent.type].glow
            )}
          >
            <div className="text-5xl mb-2">{EVENT_CONFIG[broadcastEvent.type].emoji}</div>
            <div className="text-2xl font-black text-white leading-tight">
              {EVENT_CONFIG[broadcastEvent.type].label(broadcastEvent)}
            </div>
            {broadcastEvent.pointsAdded !== undefined && (
              <div className="mt-2 text-3xl font-black text-green-400">
                +{broadcastEvent.pointsAdded} pts
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {/* Game Info Bar */}
        <div
          className="text-white rounded-2xl px-4 py-3"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-gray-500">Round</span>
              <span className="text-2xl font-black text-white">{gameState.round}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-gray-500">Room</span>
                <span className="font-mono text-green-400 font-bold tracking-widest text-sm">
                  {gameState.id.toUpperCase()}
                </span>
              </div>
              {(gameState.status === "waiting" || gameState.status === "ready") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-purple-300 border-purple-500/50 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400 gap-1.5 text-xs"
                  onClick={handleCopyInviteLink}
                >
                  <Copy className="w-3 h-3" />
                  Invite
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* My Player Hand */}
        <PlayerInfo
          key={thisPlayer?.id}
          player={thisPlayer}
          currentPlayer={currentPlayer}
          handleClickCard={handlePlayCard}
        />

        {/* Other Players */}
        <div className="flex flex-col gap-2">
          {gameState.players
            .filter((player) => player.id !== thisPlayer?.id)
            .map((player) => (
              <PlayerInfo
                key={player.id}
                player={player}
                currentPlayer={currentPlayer}
                isDisableCardsSelection
              />
            ))}
        </div>

        {/* Game Controls */}
        <div className="flex flex-col items-center gap-3 mt-1">
          <div className="flex justify-center items-center gap-4">
            <Button
              onClick={handleDrawCard}
              disabled={
                !isCurrentPlayer ||
                currentPlayer.lastDrawnCard?.type === "special" ||
                isLoading
              }
              className={cn(
                "h-12 px-8 text-base font-bold rounded-xl transition-all duration-200",
                "bg-gradient-to-r from-cyan-500 to-blue-600",
                "hover:from-cyan-400 hover:to-blue-500 hover:scale-105",
                "shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              )}
            >
              🃏 Draw ({gameState.deck.length})
            </Button>
            <Button
              onClick={handleStopDrawCard}
              disabled={blockStopButton()}
              className={cn(
                "h-12 px-8 text-base font-bold rounded-xl transition-all duration-200",
                "bg-gradient-to-r from-red-600 to-rose-600",
                "hover:from-red-500 hover:to-rose-500 hover:scale-105",
                "shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
              )}
            >
              🛑 Stop!
            </Button>
          </div>

          {gameState.flipCount > 1 && (
            <div className="flex items-center gap-2 animate-pulse">
              <span className="text-orange-300 bg-orange-500/20 border border-orange-500/50 rounded-full px-4 py-1.5 text-sm font-bold">
                🎴 Force Draw: {gameState.flipCount - 1} remaining
              </span>
            </div>
          )}
        </div>

        <audio
          ref={audioRef}
          onEnded={handleAudioEnd}
          src="/draw-card.mp3"
          crossOrigin="anonymous"
        />

        {/* Special Card Victim Modal */}
        {selectedCard && (() => {
          const activePlayers = gameState.players.filter((p) => p.status !== "stop");
          const allActiveHaveSecondChance =
            selectedCard.value === "second chance" &&
            activePlayers.length > 0 &&
            activePlayers.every((p) => p.secondChance);

          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
              <div
                className="rounded-2xl p-6 max-w-sm w-full mx-4 animate-float-in"
                style={{
                  background: "rgba(17,17,34,0.95)",
                  border: "1px solid rgba(168,85,247,0.5)",
                  boxShadow: "0 0 40px rgba(168,85,247,0.3)",
                }}
              >
                <div className="text-center mb-5">
                  <div className="text-3xl mb-2">
                    {selectedCard.value === "freeze" ? "❄️" :
                     selectedCard.value === "flip three" ? "🎴" : "💖"}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {allActiveHaveSecondChance ? (
                      <span className="text-pink-300">Second Chance</span>
                    ) : (
                      <>
                        Select a target for{" "}
                        <span className="text-purple-300 capitalize">{selectedCard.value}</span>
                      </>
                    )}
                  </h3>
                </div>

                {allActiveHaveSecondChance ? (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-pink-200/80 bg-pink-900/30 border border-pink-500/30 rounded-xl px-4 py-3">
                      All active players already have Second Chance. The card will be discarded.
                    </p>
                    <Button
                      onClick={() => {
                        // All active players have secondChance=true; server will discard the card.
                        const anyActive = gameState.players.find((p) => p.status !== "stop")!;
                        selectSpecialCardVictim(anyActive, selectedCard);
                      }}
                      className={cn(
                        "w-full font-semibold rounded-xl transition-all duration-200",
                        "bg-pink-700/50 hover:bg-pink-600/60 border border-pink-500/60",
                        "hover:scale-105 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                      )}
                    >
                      Discard Card
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap justify-center gap-2">
                    {gameState.players.map((player) => (
                      <Button
                        disabled={!!isDisablePlayerButtonSelection(player, selectedCard)}
                        key={player.id}
                        onClick={() => selectSpecialCardVictim(player, selectedCard)}
                        className={cn(
                          "font-semibold rounded-xl transition-all duration-200",
                          "bg-purple-600/40 hover:bg-purple-500/60 border border-purple-500/50",
                          "hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
                          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                        )}
                      >
                        {player.name}
                      </Button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setSelectedCard(null)}
                  className="mt-4 w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()}

        {/* Win / Score Screen */}
        {isGameFinished && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {["bg-yellow-400", "bg-purple-400", "bg-pink-400", "bg-cyan-400", "bg-green-400"].map((color, i) =>
                Array.from({ length: 6 }).map((_, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={cn(
                      "absolute w-2 h-2 rounded-sm animate-confetti-fall",
                      color
                    )}
                    style={{
                      left: `${(i * 20 + j * 3) % 100}%`,
                      top: "-10px",
                      animationDelay: `${(i * 0.2 + j * 0.15)}s`,
                      animationDuration: `${1.2 + (i + j) * 0.1}s`,
                    }}
                  />
                ))
              )}
            </div>

            <div
              className="relative rounded-3xl px-8 py-6 max-w-md w-full mx-4 animate-float-in"
              style={{
                background: "rgba(10,10,20,0.98)",
                border: "1px solid rgba(168,85,247,0.5)",
                boxShadow: "0 0 60px rgba(168,85,247,0.3), 0 0 120px rgba(168,85,247,0.1)",
              }}
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">🏆</div>
                <h2
                  className="text-4xl font-black"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  GAME OVER
                </h2>
                <p className="text-gray-400 text-sm mt-1">Final Standings</p>
              </div>

              <div className="flex flex-col gap-2 mb-6">
                {sortedScoreboard.map((player, index) => (
                  <div
                    key={player.id}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3",
                      index === 0
                        ? "bg-yellow-500/20 border border-yellow-500/40"
                        : index === 1
                        ? "bg-gray-500/20 border border-gray-500/30"
                        : index === 2
                        ? "bg-amber-700/20 border border-amber-700/30"
                        : "bg-white/5 border border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {index < 3 ? rankEmojis[index] : `#${index + 1}`}
                      </span>
                      <span className={cn(
                        "font-bold text-base",
                        index < 3 ? rankColors[index] : "text-gray-300"
                      )}>
                        {player.name}
                      </span>
                    </div>
                    <span className={cn(
                      "font-black text-xl",
                      index === 0 ? "text-yellow-300" : "text-gray-400"
                    )}>
                      {player.score}
                      <span className="text-xs font-medium text-gray-600 ml-1">pts</span>
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleRestartGame}
                className={cn(
                  "w-full h-12 text-base font-bold rounded-xl transition-all duration-200",
                  "bg-gradient-to-r from-purple-600 to-pink-600",
                  "hover:from-purple-500 hover:to-pink-500 hover:scale-105",
                  "shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                )}
              >
                🎮 Play Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
