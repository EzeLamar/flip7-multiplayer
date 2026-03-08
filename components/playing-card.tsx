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

interface CardStyle {
  bg: string;
  glow: string;
  icon: string;
}

export function PlayingCard({
  card,
  onClick,
  disabled,
  isRepeated,
  className,
}: PlayingCardProps) {
  const getCardStyle = (value: string): CardStyle => {
    if (card.type === "special") {
      if (value === "freeze") {
        return {
          bg: "bg-gradient-to-br from-cyan-300 via-blue-400 to-blue-900",
          glow: "shadow-[0_0_12px_rgba(6,182,212,0.6)]",
          icon: "❄️",
        };
      }
      if (value === "flip three") {
        return {
          bg: "bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-700",
          glow: "shadow-[0_0_12px_rgba(249,115,22,0.6)]",
          icon: "🎴",
        };
      }
      if (value === "second chance") {
        return {
          bg: "bg-gradient-to-br from-pink-400 via-red-500 to-rose-800",
          glow: "shadow-[0_0_12px_rgba(236,72,153,0.6)]",
          icon: "💖",
        };
      }
    }

    if (card.type === "modifier") {
      return {
        bg: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700",
        glow: "shadow-[0_0_12px_rgba(234,179,8,0.6)]",
        icon: "✨",
      };
    }

    // Number cards
    const numberStyles: Record<string, CardStyle> = {
      "12": { bg: "bg-gradient-to-br from-red-400 to-red-700", glow: "shadow-[0_0_10px_rgba(239,68,68,0.6)]", icon: "" },
      "11": { bg: "bg-gradient-to-br from-blue-400 to-blue-700", glow: "shadow-[0_0_10px_rgba(59,130,246,0.6)]", icon: "" },
      "10": { bg: "bg-gradient-to-br from-green-400 to-green-700", glow: "shadow-[0_0_10px_rgba(34,197,94,0.6)]", icon: "" },
      "9":  { bg: "bg-gradient-to-br from-yellow-400 to-yellow-600", glow: "shadow-[0_0_10px_rgba(234,179,8,0.6)]", icon: "" },
      "8":  { bg: "bg-gradient-to-br from-purple-400 to-purple-700", glow: "shadow-[0_0_10px_rgba(168,85,247,0.6)]", icon: "" },
      "7":  { bg: "bg-gradient-to-br from-pink-400 to-pink-700", glow: "shadow-[0_0_10px_rgba(236,72,153,0.6)]", icon: "" },
      "6":  { bg: "bg-gradient-to-br from-orange-400 to-orange-700", glow: "shadow-[0_0_10px_rgba(249,115,22,0.6)]", icon: "" },
      "5":  { bg: "bg-gradient-to-br from-teal-400 to-teal-700", glow: "shadow-[0_0_10px_rgba(20,184,166,0.6)]", icon: "" },
      "4":  { bg: "bg-gradient-to-br from-indigo-400 to-indigo-700", glow: "shadow-[0_0_10px_rgba(99,102,241,0.6)]", icon: "" },
      "3":  { bg: "bg-gradient-to-br from-cyan-400 to-cyan-700", glow: "shadow-[0_0_10px_rgba(6,182,212,0.6)]", icon: "" },
      "2":  { bg: "bg-gradient-to-br from-lime-400 to-lime-700", glow: "shadow-[0_0_10px_rgba(132,204,22,0.6)]", icon: "" },
      "1":  { bg: "bg-gradient-to-br from-amber-400 to-amber-700", glow: "shadow-[0_0_10px_rgba(245,158,11,0.6)]", icon: "" },
      "0":  { bg: "bg-gradient-to-br from-rose-400 to-rose-700", glow: "shadow-[0_0_10px_rgba(244,63,94,0.6)]", icon: "" },
    };

    return numberStyles[value] ?? { bg: "bg-gradient-to-br from-gray-600 to-gray-800", glow: "", icon: "" };
  };

  const getDisplayText = (value: string): string => {
    if (value === "second chance") return "SC";
    if (value === "freeze") return "FR";
    if (value === "flip three") return "F3";
    return value;
  };

  const style = getCardStyle(card.value);
  const isLargeCard = className?.includes("w-16") || className?.includes("h-28");

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl flex flex-col items-center justify-center text-white font-bold",
        "transform transition-all duration-200",
        "hover:scale-110 hover:brightness-110",
        "relative overflow-hidden",
        style.bg,
        !isRepeated && style.glow,
        isRepeated && [
          "animate-shake",
          "border-2 border-red-400",
          "shadow-[0_0_15px_rgba(239,68,68,0.8),0_0_30px_rgba(239,68,68,0.4)]",
        ],
        disabled && "opacity-40 cursor-not-allowed hover:scale-100 hover:brightness-100",
        className
      )}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

      {isLargeCard ? (
        <>
          {/* Top-left value */}
          <span className="absolute top-1 left-2 text-xs font-black opacity-80 leading-none">
            {getDisplayText(card.value)}
          </span>
          {/* Center content */}
          <div className="flex flex-col items-center gap-0.5">
            {style.icon && <span className="text-lg leading-none">{style.icon}</span>}
            <span className="text-2xl font-black leading-none">{getDisplayText(card.value)}</span>
          </div>
          {/* Bottom-right value (rotated) */}
          <span className="absolute bottom-1 right-2 text-xs font-black opacity-80 leading-none rotate-180">
            {getDisplayText(card.value)}
          </span>
        </>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          {style.icon && <span className="text-xs leading-none">{style.icon}</span>}
          <span className="text-sm font-black leading-none">{getDisplayText(card.value)}</span>
        </div>
      )}
    </button>
  );
}
