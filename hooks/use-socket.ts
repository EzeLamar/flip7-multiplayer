"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/lib/types';
import { toast } from 'sonner';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('gameCreated', ({ gameState }) => {
      setGameState(gameState);
      toast.success(`Game created! Share code: ${gameState.id}`);
    });

    newSocket.on('playerJoined', ({ gameState }) => {
      setGameState(gameState);
      toast.success('New player joined!');
    });

    newSocket.on('gameStarted', ({ gameState }) => {
      setGameState(gameState);
      toast.success('Game started!');
    });

    newSocket.on('gameStateUpdated', ({ gameState }) => {
      setGameState(gameState);
    });

    newSocket.on('gameOver', ({ winner }) => {
      toast.success(`Game Over! ${winner.name} wins!`);
    });

    newSocket.on('error', (message) => {
      toast.error(message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const createGame = (playerName: string) => {
    socket?.emit('createGame', playerName);
  };

  const joinGame = (gameId: string, playerName: string) => {
    socket?.emit('joinGame', { gameId, playerName });
  };

  const startGame = (gameId: string) => {
    socket?.emit('startGame', gameId);
  };

  return {
    socket,
    gameState,
    createGame,
    joinGame,
    startGame,
  };
}