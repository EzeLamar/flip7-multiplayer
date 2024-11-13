"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { Card as CardType, GameState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlayingCard } from "@/components/playing-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PlayerInfo } from "@/components/ui/gamerInfo";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  gameState: GameState;
  socket: Socket;
}

export function GameBoard({ gameState, socket }: GameBoardProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const thisPlayer = gameState.players.find(
    (player) => player.id === socket.id
  );
  const isCurrentPlayer = currentPlayer?.id === socket.id;

  const handlePlayCard = (cardIndex: number) => {
    if (!isCurrentPlayer) return;

    const card = currentPlayer.cards[cardIndex];
    if (card.type === "special" && !selectedColor) {
      setSelectedColor("pending");
      return;
    }

    socket.emit("playCard", {
      gameId: gameState.id,
      cardIndex,
      selectedColor,
    });
    setSelectedColor(null);
  };

  const handleDrawCard = () => {
    if (!isCurrentPlayer) return;
    socket.emit("drawCard", gameState.id);
  };

  const handleStopDrawCard = () => {
    if (!isCurrentPlayer) return;
    socket.emit("stopDrawCard", gameState.id);
  };

  const selectWildColor = (color: string) => {
    setSelectedColor(color);
    // Re-emit the last attempted card play with the selected color
    const wildCardIndex = currentPlayer.cards.findIndex(
      (card) => card.type === "special"
    );
    if (wildCardIndex !== -1) {
      handlePlayCard(wildCardIndex);
    }
  };

  const blockStopButton = () => {
    if (!isCurrentPlayer) {
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

  useEffect(() => {
    if (gameState.status === "finished") {
      const winner = gameState.players.find((p) => p.cards.length === 0);
      if (winner) {
        toast.success(`${winner.name} wins the game!`);
      }
    }
  }, [gameState.players, gameState.status]);

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 gap-6">
        {/* Game Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-bold mb-2">Game Info</h2>
            <p>Room: {gameState.id}</p>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center items-center gap-10">
          <Button
            className="w-20 h-32"
            onClick={handleDrawCard}
            disabled={!isCurrentPlayer}
          >
            {`Draw (${gameState.deck.length})`}
          </Button>
          <Button
            className="rounded-full border-2 border-primary px-3 py-7"
            onClick={handleStopDrawCard}
            disabled={blockStopButton()}
            variant="destructive"
          >
            Stop!
          </Button>
        </div>

        {/* Player's Hand */}
        <div
          className={cn(
            "bg-white/90 backdrop-blur-sm rounded-lg p-4 min-h-[13rem]",
            isCurrentPlayer &&
              "border-2 border-primary transform transition-transform scale-105"
          )}
        >
          <div className="flex justify-between gap-3">
            <h3 className="text-lg font-semibold mb-4">{thisPlayer?.name}</h3>
            <h3 className="text-lg font-semibold mb-4">{`Score: ${thisPlayer?.score}`}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {thisPlayer?.cards.map((card, index) => (
              <PlayingCard
                key={index}
                card={card}
                onClick={() => handlePlayCard(index)}
                isRepeated={
                  thisPlayer?.cards.filter((c) => c.value === card.value)
                    .length > 1
                }
                disabled={!isCurrentPlayer || currentPlayer.status === "start"}
                className="w-16 h-28"
              />
            ))}
          </div>
        </div>

        {/* Other Player's Info */}
        <div className="flex-col">
          {gameState.players
            .filter((player) => player.id !== thisPlayer?.id)
            .map((player) => (
              <PlayerInfo
                key={player.id}
                player={player}
                isCurrentPlayer={currentPlayer?.id === player.id}
              />
            ))}
        </div>

        {/* Wild Color Selection */}
        {selectedColor === "pending" && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Select a Color</h3>
              <div className="grid grid-cols-2 gap-2">
                {["red", "blue", "green", "yellow"].map((color) => (
                  <Button
                    key={color}
                    onClick={() => selectWildColor(color)}
                    className={`bg-${color}-500 hover:bg-${color}-600`}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
