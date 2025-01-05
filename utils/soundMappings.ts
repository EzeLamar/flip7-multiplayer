export const soundMappings = {
    draw: "/sounds/draw-card.mp3",
    stop: "/sounds/stop.mp3",
    duplicates: "/sounds/duplicates.mp3",
    flip7: "/sounds/flip7.mp3",
    special: "/sounds/special.mp3",
    win: "/sounds/win.mp3",
  };
  
  export type SoundKey = keyof typeof soundMappings;
  