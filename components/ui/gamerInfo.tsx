"use client";

import { PlayingCard } from "@/components/playing-card";
import { Player } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface PlayerInfoProps {
  player: Player;
  currentPlayer?: Player;
  className?: string;
  isDisableCardsSelection?: boolean;
  handleClickCard?: (cardIndex: number) => void;
}

export function PlayerInfo({
  player,
  currentPlayer,
  className,
  isDisableCardsSelection = false,
  handleClickCard = (_cardIndex: number) => {},
}: PlayerInfoProps) {
  const isCurrentTurn = player.id === currentPlayer?.id;
  const isStopped = player.status === "stop";

  return (
    <div
      className={cn(
        "rounded-2xl p-3 flex-col gap-2 transition-all duration-300 relative overflow-hidden",
        "border",
        // Base dark style
        "bg-white/5 backdrop-blur-sm border-white/10",
        // Current player: neon purple pulse
        isCurrentTurn && !isStopped && [
          "border-purple-400/70",
          "scale-[1.02]",
          "animate-neon-pulse",
        ],
        // Stopped: red neon border, dimmed
        isStopped && [
          "border-red-500/50",
          "opacity-60",
          "shadow-[0_0_10px_rgba(239,68,68,0.2)]",
        ],
        className
      )}
    >
      {/* Header row */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "text-base font-bold",
            isStopped ? "text-gray-400" : "text-white"
          )}>
            {player.name}
          </span>
          {isCurrentTurn && !isStopped && (
            <span className="text-xs text-purple-300 bg-purple-500/20 border border-purple-500/40 rounded-full px-2 py-0.5 font-semibold">
              Your turn
            </span>
          )}
          {isStopped && (
            <span className="text-xs font-bold tracking-widest text-red-400 bg-red-500/20 border border-red-500/40 rounded-full px-2 py-0.5 uppercase">
              Stopped
            </span>
          )}
          {player.secondChance && (
            <div className="flex items-center gap-1">
              <Heart fill="currentColor" className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="text-xs text-red-400 font-semibold">2nd Chance</span>
            </div>
          )}
        </div>
        <span className={cn(
          "text-xl font-black",
          isStopped ? "text-gray-500" : "text-yellow-300"
        )}>
          {player.score}
          <span className="text-xs font-medium text-gray-500 ml-1">pts</span>
        </span>
      </div>

      {/* Cards hand */}
      <div className="flex flex-wrap gap-2">
        {player.cards.map((card, index) => (
          <PlayingCard
            key={index}
            card={card}
            onClick={() => handleClickCard(index)}
            isRepeated={
              player.cards.filter((c) => c.value === card.value).length > 1
            }
            disabled={
              isDisableCardsSelection || player.id !== currentPlayer?.id
            }
            className="w-10 h-14"
          />
        ))}
        {player.cards.length === 0 && player.status !== "stop" && (
          <span className="text-xs text-gray-600 italic py-1">No cards yet</span>
        )}
      </div>
    </div>
  );
}
