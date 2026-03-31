export type Language = "en" | "es";

export const translations = {
  en: {
    // page
    subtitle: "Multiplayer Card Game",

    // game-lobby
    joinGame: "Join a Game",
    createGame: "Create a Game",
    yourName: "Your name",
    gameCode: "Game code",
    joinGameBtn: "Join Game",
    createNewGame: "Create New Game",
    createGameBtn: "Create Game",
    joinExistingGame: "Join Existing Game",
    gameHint:
      "Collect cards without duplicates • 7 unique numbers = FLIP7! • First to 200 pts wins",
    howToPlay: "How to play ▼",
    hideRules: "Hide rules ▲",

    // loading
    loadingMessages: [
      "Shuffling the deck...",
      "Setting up the table...",
      "Hiding the Freeze cards...",
      "Calculating your luck...",
      "Almost there...",
      "Polishing the cards...",
      "Finding a good seat...",
    ],
    loadingWakingUp:
      "The server is waking up — this can take up to a minute on first load.",
    loadingStayOnPage: "Please stay on this page!",
    whileYouWait: "While you wait — how to play",

    // rules
    objective: "Objective",
    objectiveText:
      "Be the first player to reach 200 points across multiple rounds.",
    yourTurn: "Your Turn",
    yourTurnItems: [
      "Draw cards one at a time to build your hand.",
      ["Press ", "Stop", " at any time to lock in your score for the round."],
      [
        "Drawing a ",
        "duplicate number",
        " causes a bust — you lose all cards and score 0 this round.",
      ],
    ],
    flip7Title: "FLIP 7",
    flip7Text: [
      "Collect 7 ",
      "different",
      " number cards to trigger FLIP 7. You automatically stop and earn a ",
      "+15 bonus",
      " on top of your card total.",
    ],
    cardTypes: "Card Types",
    cardTypeItems: [
      ["Number cards (0–12)", " — contribute their face value to your score."],
      [
        "+2 / +4 / +6 / +8 / +10",
        " — add that amount to your total score.",
      ],
      [
        "x2",
        " — doubles your number-card subtotal before additive modifiers are applied.",
      ],
    ],
    specialCards: "Special Cards",
    specialCardItems: [
      [
        "❄️ Freeze",
        " — force a target player to stop immediately, locking their current score.",
      ],
      [
        "🎴 Flip Three",
        " — force a target player to draw 3 additional cards right now.",
      ],
      [
        "💖 Second Chance",
        " — give a player a safety net: if they would bust on their next duplicate, the duplicate and this card are discarded instead of losing everything.",
      ],
    ],
    scoringOrder: "Scoring Order",
    scoringItems: [
      "Sum all number cards.",
      "Apply x2 if held (doubles the number total).",
      "Add all +X modifier cards.",
      "Add +15 if FLIP 7 was achieved.",
    ],

    // game-board
    round: "Round",
    room: "Room",
    invite: "Invite",
    sound: "Sound",
    muted: "Muted",
    rules: "Rules",
    rulesTitle: "Game Rules",
    draw: "Draw",
    stop: "Stop!",
    forceDraw: "Force Draw",
    remaining: "remaining",
    gameOver: "GAME OVER",
    finalStandings: "Final Standings",
    playAgain: "🎮 Play Again",
    selectTarget: "Select a target for",
    secondChanceTitle: "Second Chance",
    allHaveSecondChance:
      "All active players already have Second Chance. The card will be discarded.",
    discardCard: "Discard Card",
    cancel: "Cancel",
    pts: "pts",

    // toasts
    inviteCopied: "Invite link copied! Share it to invite players.",
    copyError: "Copy not supported — room code: ",
    winsGame: "wins the game!",

    // event labels
    eventFreeze: (target: string, source: string) =>
      `${target} was FROZEN by ${source}!`,
    eventFlipThree: (target: string) => `${target} must draw 3 cards!`,
    eventSecondChance: (target: string) => `${target} got Second Chance!`,
    eventBust: (target: string) => `${target} BUSTED!`,
    eventFlip7: (target: string) => `${target} got FLIP 7! +15 bonus!`,
    eventStop: (target: string) => `${target} stopped drawing!`,
  },

  es: {
    // page
    subtitle: "Juego de Cartas Multijugador",

    // game-lobby
    joinGame: "Unirse a una Partida",
    createGame: "Crear una Partida",
    yourName: "Tu nombre",
    gameCode: "Código de sala",
    joinGameBtn: "Unirse",
    createNewGame: "Crear Nueva Partida",
    createGameBtn: "Crear Partida",
    joinExistingGame: "Unirse a una Partida",
    gameHint:
      "Juntá cartas sin duplicados • 7 números únicos = FLIP7! • El primero en 200 pts gana",
    howToPlay: "Cómo jugar ▼",
    hideRules: "Ocultar reglas ▲",

    // loading
    loadingMessages: [
      "Barajando el mazo...",
      "Preparando la mesa...",
      "Escondiendo las cartas de Freeze...",
      "Calculando tu suerte...",
      "Ya casi...",
      "Puliendo las cartas...",
      "Buscando un buen asiento...",
    ],
    loadingWakingUp:
      "El servidor se está despertando — puede tardar hasta un minuto en la primera carga.",
    loadingStayOnPage: "¡Por favor, quedate en esta página!",
    whileYouWait: "Mientras esperás — cómo jugar",

    // rules
    objective: "Objetivo",
    objectiveText:
      "Sé el primero en llegar a 200 puntos a lo largo de varias rondas.",
    yourTurn: "Tu Turno",
    yourTurnItems: [
      "Robá cartas de a una para armar tu mano.",
      ["Presioná ", "Parar", " en cualquier momento para asegurar tu puntaje."],
      [
        "Robar un ",
        "número duplicado",
        " te hace quedar en cero — perdés todas las cartas de la ronda.",
      ],
    ],
    flip7Title: "FLIP 7",
    flip7Text: [
      "Juntá 7 números ",
      "diferentes",
      " para activar el FLIP 7. Parás automáticamente y ganás un ",
      "bono de +15",
      " sobre el total de tus cartas.",
    ],
    cardTypes: "Tipos de Cartas",
    cardTypeItems: [
      [
        "Cartas numéricas (0–12)",
        " — suman su valor nominal a tu puntaje.",
      ],
      ["+2 / +4 / +6 / +8 / +10", " — añaden ese valor a tu puntaje total."],
      [
        "x2",
        " — duplica el subtotal de cartas numéricas antes de aplicar los modificadores.",
      ],
    ],
    specialCards: "Cartas Especiales",
    specialCardItems: [
      [
        "❄️ Freeze",
        " — forzá a un jugador a parar inmediatamente, bloqueando su puntaje.",
      ],
      [
        "🎴 Flip Three",
        " — forzá a un jugador a robar 3 cartas adicionales ahora mismo.",
      ],
      [
        "💖 Second Chance",
        " — dale a un jugador una red de seguridad: si sacan un duplicado, descartan la carta en vez de perder todo.",
      ],
    ],
    scoringOrder: "Orden de Puntuación",
    scoringItems: [
      "Sumá todas las cartas numéricas.",
      "Aplicá x2 si la tenés (duplica el total numérico).",
      "Sumá todos los modificadores +X.",
      "Añadí +15 si lograste FLIP 7.",
    ],

    // game-board
    round: "Ronda",
    room: "Sala",
    invite: "Invitar",
    sound: "Sonido",
    muted: "Silenciado",
    rules: "Reglas",
    rulesTitle: "Reglas del Juego",
    draw: "Robar",
    stop: "¡Parar!",
    forceDraw: "Robo Forzado",
    remaining: "restantes",
    gameOver: "JUEGO TERMINADO",
    finalStandings: "Clasificación Final",
    playAgain: "🎮 Jugar de Nuevo",
    selectTarget: "Elegí un objetivo para",
    secondChanceTitle: "Segunda Oportunidad",
    allHaveSecondChance:
      "Todos los jugadores activos ya tienen Segunda Oportunidad. La carta será descartada.",
    discardCard: "Descartar Carta",
    cancel: "Cancelar",
    pts: "pts",

    // toasts
    inviteCopied: "¡Link de invitación copiado! Compartilo para invitar jugadores.",
    copyError: "Copiar no disponible — código de sala: ",
    winsGame: "¡ganó la partida!",

    // event labels
    eventFreeze: (target: string, source: string) =>
      `¡${target} fue CONGELADO por ${source}!`,
    eventFlipThree: (target: string) => `¡${target} debe robar 3 cartas!`,
    eventSecondChance: (target: string) =>
      `¡${target} obtuvo Segunda Oportunidad!`,
    eventBust: (target: string) => `¡${target} se PASÓ!`,
    eventFlip7: (target: string) => `¡${target} hizo FLIP 7! ¡+15 bonus!`,
    eventStop: (target: string) => `¡${target} paró de robar!`,
  },
};

export type Translations = (typeof translations)["en"];
