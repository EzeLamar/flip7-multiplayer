export const soundMappings = {
  draw: "/sounds/draw.mp3",
  stop: "/sounds/stop.mp3",
  duplicates: "/sounds/duplicates.mp3",
  flip7: "/sounds/flip7.mp3",
  special: "/sounds/special.mp3",
  getSecondChance: "/sounds/extra-life.mp3",
  useSecondChance: "/sounds/cure.mp3",
  useFreeze: "/sounds/freeze.wav",
  useFlip3: "/sounds/flip3.mp3",
  win: "/sounds/win.mp3",
};

export type SoundKey = keyof typeof soundMappings;
