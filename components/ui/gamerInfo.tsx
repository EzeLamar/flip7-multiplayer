"use client";

import { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer?: boolean;
  className?: string;
}

export function PlayerInfo({
  player,
  isCurrentPlayer,
  className,
}: PlayerInfoProps) {
  return (
    <div
      className={cn(
        "bg-white/90 backdrop-blur-sm rounded-lg p-4 flex-col gap-3 w-36 items-center text-center font-bold shadow-lg transform transition-transform hover:scale-105",
        className,
        isCurrentPlayer && "bg-primary text-primary-foreground",
        player.status === "stop" && "bg-red-500 text-white opacity-70"
      )}
    >
      <div className="text-xl">{player.name}</div>
      <div className="text-xl">{player.score}</div>
    </div>
  );
}
