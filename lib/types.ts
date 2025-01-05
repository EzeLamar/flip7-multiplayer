export interface Card {
  value: string;
  type: "number" | "special" | "modifier";
}

export type PlayerStatus = "start" | "dealing" | "stop";

export type PlayerHandStatus = "normal" | "special" | "duplicates" | "stop" | "flip7";

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  lastDrawnCard: Card | null;
  status: PlayerStatus;
  secondChance: boolean;
  score: number;
}

export interface GameState {
  id: string;
  round: number;
  players: Player[];
  currentPlayer: number;
  deck: Card[];
  discardPile: Card[];
  direction: number;
  flipCount: number;
  status: "waiting" | "ready" | "playing" | "stopped" | "finished";
}
