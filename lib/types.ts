export interface Card {
  value: "freeze" | "flip three" | "second chance" | string;
  type: "number" | "special" | "modifier";
}

export type PlayerStatus = "start" | "dealing" | "stop";

export type PlayerHandStatus =
  | "normal"
  | "special"
  | "duplicates"
  | "useSecondChance"
  | "stop"
  | "flip7";

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  lastDrawnCard: Card | null;
  status: PlayerStatus;
  secondChance: boolean;
  score: number;
  busted: boolean;
}

export interface LastEvent {
  type: "freeze" | "flip-three" | "second-chance" | "bust" | "flip7" | "stop";
  targetName?: string;
  sourceName?: string;
  pointsAdded?: number;
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
  lastEvent: LastEvent | null;
  roundEnding: boolean;
}
