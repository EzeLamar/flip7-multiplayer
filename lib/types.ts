export interface Card {
  value: string;
  type: "number" | "special" | "wild";
}

type PlayerStatus = "start" | "dealing" | "stop";

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  status: PlayerStatus;
  score: number;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayer: number;
  deck: Card[];
  discardPile: Card[];
  direction: number;
  status: "waiting" | "ready" | "playing" | "stopped" | "finished";
}
