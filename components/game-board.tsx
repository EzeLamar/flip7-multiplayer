"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {
  Card,
  Card as CardType,
  GameState,
  Player,
  PlayerHandStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlayerInfo } from "@/components/ui/gamerInfo";
import { cn } from "@/lib/utils";
import { soundMappings, SoundKey } from "@/utils/soundMappings";

interface GameBoardProps {
  gameState: GameState;
  socket: Socket;
  handleRestartGame: () => void;
}

export function GameBoard({
  gameState,
  socket,
  handleRestartGame,
}: GameBoardProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<SoundKey | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isGameFinished =
    gameState.status === "finished" &&
    gameState.players.every((p) => p.status === "stop");
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const thisPlayer = gameState.players.find(
    (player) => player.id === socket.id
  );
  const isCurrentPlayer = currentPlayer?.id === socket.id;

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
    }
    else {
      playSound("draw");
    }
    setIsLoading(true);
    socket.emit(
      "drawCard",
      gameState.id,
      (response: { status: PlayerHandStatus }) => {
        console.log(response);
        //   const cardValues = currentPlayer.cards.map((card) => card.value);
        // const hasDuplicates = cardValues.some(
        //   (value, index) => cardValues.indexOf(value) !== index
        // );
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
    const handleGameStateUpdated = (updatedGameState: GameState) => {
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
      audioRef.current.currentTime = 0; // Reset to start
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

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-1 gap-2">
        {/* Game Info */}
        <div className="bg-black/80 text-white backdrop-blur-sm rounded-lg p-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Round {gameState.round}</h2>
            <p>Room: {gameState.id}</p>
          </div>
        </div>

        {/* Player's Hand */}
        {/* <div
          className={cn(
            "bg-white/90 backdrop-blur-sm rounded-lg p-4 min-h-[13rem]",
            isCurrentPlayer &&
              "border-2 border-primary transform transition-transform scale-105"
          )}
        >
          <div className="flex justify-between gap-3">
            <h3 className="text-lg font-semibold mb-4">
              {thisPlayer?.name} {thisPlayer?.secondChance && "(2nd chance)"}
            </h3>
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
        </div> */}
        <PlayerInfo
          key={thisPlayer?.id}
          player={thisPlayer}
          currentPlayer={currentPlayer}
          handleClickCard={handlePlayCard}
        />

        {/* Other Player's Info */}
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
        <div className="flex justify-center items-center gap-10 mt-2">
          <Button
            className={cn("enabled:hover:scale-105")}
            onClick={handleDrawCard}
            disabled={
              !isCurrentPlayer ||
              currentPlayer.lastDrawnCard?.type === "special"
            }
          >
            {`Draw (${gameState.deck.length})`}
          </Button>
          <Button
            className="enabled:hover:scale-105"
            onClick={handleStopDrawCard}
            disabled={blockStopButton()}
            variant="destructive"
          >
            Stop!
          </Button>
          <audio
            ref={audioRef}
            onEnded={handleAudioEnd}
            src="/draw-card.mp3"
            crossOrigin="anonymous"
          />
        </div>

        {gameState.flipCount > 1 && (
          <h1 className="text-lg text-white text-center mt-2">
            Force to Draw: {gameState.flipCount - 1}
          </h1>
        )}

        {/* Special Card Victim Modal */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Select a Player</h3>
              <div className="flex justify-center gap-2">
                {gameState.players.map((player) => (
                  <Button
                    disabled={isDisablePlayerButtonSelection(
                      player,
                      selectedCard
                    )}
                    key={player.id}
                    onClick={() =>
                      selectSpecialCardVictim(player, selectedCard)
                    }
                    className={`bg-blue-500 hover:bg-blue-600`}
                  >
                    {player.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Score board Modal */}
        {isGameFinished && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white px-5 py-3 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Final Score</h3>
              <div className="flex flex-col justify-center gap-2">
                {gameState.players
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((player) => (
                    <p key={player.id}>
                      {player.name}: {player.score}
                    </p>
                  ))}
              </div>
              <Button
                className={cn("mt-3 enabled:hover:scale-105")}
                onClick={handleRestartGame}
              >
                Play Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
