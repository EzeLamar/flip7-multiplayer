"use client";

import { PlayingCard } from "@/components/playing-card";
import { Player } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";

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
  return (
    <div
      className={cn(
        "bg-white/90 backdrop-blur-sm rounded-lg p-3 flex-col gap-2 items-center text-center font-bold shadow-lg transform transition-transform hover:scale-105",
        className,
        player.id === currentPlayer?.id &&
          "border-2 border-primary transform transition-transform scale-105",
        player.status === "stop" && "bg-red-500 text-white opacity-70"
      )}
    >
      <div className="flex justify-between">
        <div className="text-xl">
          {player.name} {player?.secondChance && "(2nd chance)"}
        </div>
        <div className="text-xl">{`Score: ${player.score}`}</div>
      </div>
      {/* Other Player's Hand */}
      <div key={player.id} className="rounded-lg py-2">
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
              className="w-10 h-12"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
