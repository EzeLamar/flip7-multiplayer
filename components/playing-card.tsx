"use client";

import { Card as CardType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PlayingCardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isRepeated?: boolean;
  className?: string;
}

export function PlayingCard({
  card,
  onClick,
  disabled,
  isRepeated,
  className,
}: PlayingCardProps) {
  const getCardColor = (value: string) => {
    if (card.type === "special") {
      return "bg-gray-800";
    }
    if (card.type === "modifier") {
      return "bg-yellow-800";
    }
    if (card.type === "number") {
      switch (value) {
        case "12":
          return "bg-red-500";
        case "11":
          return "bg-blue-500";
        case "10":
          return "bg-green-500";
        case "9":
          return "bg-yellow-500";
        case "8":
          return "bg-purple-500";
        case "7":
          return "bg-pink-500";
        case "6":
          return "bg-orange-500";
        case "5":
          return "bg-teal-500";
        case "4":
          return "bg-indigo-500";
        case "3":
          return "bg-cyan-500";
        case "2":
          return "bg-lime-500";
        case "1":
          return "bg-amber-500";
        case "0":
          return "bg-rose-500";
        default:
          return "bg-gray-800";
      }
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-20 h-32 rounded-lg flex items-center justify-center text-white font-bold shadow-lg transform transition-transform hover:scale-105",
        getCardColor(card.value),
        isRepeated && "border-4 border-red-500",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="text-xl">{card.value}</span>
    </button>
  );
}
