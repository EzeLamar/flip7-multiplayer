"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { Card as CardType, GameState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlayingCard } from "@/components/playing-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

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
    if (card.type === "wild" && !selectedColor) {
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
      (card) => card.type === "wild"
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
      <div className="grid grid-cols-1 gap-8">
        {/* Game Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">Game Info</h2>
          <p>Game ID: {gameState.id}</p>
          <p>Player: {thisPlayer?.name}</p>
          <p>Score: {thisPlayer?.score}</p>
          <p>Cards in Deck: {gameState.deck.length}</p>
          <p>Current Player: {currentPlayer?.name}</p>
        </div>

        {/* Player's Hand */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Your Hand</h3>
          <ScrollArea className="h-60">
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
                  disabled={
                    !isCurrentPlayer || currentPlayer.status === "start"
                  }
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4">
          <Button onClick={handleDrawCard} disabled={!isCurrentPlayer}>
            Draw Card
          </Button>
          <Button
            onClick={handleStopDrawCard}
            disabled={blockStopButton()}
            variant="secondary"
          >
            Stop!
          </Button>
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
