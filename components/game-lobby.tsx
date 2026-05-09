"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameBoard } from "@/components/game-board";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";
import { GameCustomConfig } from "@/lib/types";

const LOADING_MESSAGE_INTERVAL_MS = 2500;

type GameMode = "classic" | "vengeance" | "custom";

interface CardDef {
  icon: string;
  label: string;
  value: string;
  configKey: keyof GameCustomConfig;
}

const CLASSIC_SPECIALS: CardDef[] = [
  { icon: "❄️", label: "Freeze",         value: "freeze",        configKey: "enabledSpecials" },
  { icon: "🎴", label: "Flip Three",     value: "flip three",    configKey: "enabledSpecials" },
  { icon: "💖", label: "Second Chance",  value: "second chance", configKey: "enabledSpecials" },
];
const VENGEANCE_ACTION: CardDef[] = [
  { icon: "🃏", label: "Flip Four",      value: "flip four",     configKey: "enabledSpecials" },
  { icon: "➕", label: "Just One More",  value: "just one more", configKey: "enabledSpecials" },
  { icon: "🫴", label: "Steal",          value: "steal",         configKey: "enabledSpecials" },
  { icon: "🗑️", label: "Discard",        value: "discard",       configKey: "enabledSpecials" },
  { icon: "🔄", label: "Swap",           value: "swap",          configKey: "enabledSpecials" },
];
const VENGEANCE_NUMBERS: CardDef[] = [
  { icon: "🍀", label: "Lucky 13",  value: "lucky 13",  configKey: "enabledSpecialNumbers" },
  { icon: "💀", label: "Unlucky 7", value: "unlucky 7", configKey: "enabledSpecialNumbers" },
];
const VENGEANCE_MODS: CardDef[] = [
  { icon: "➗", label: "÷2", value: "÷2", configKey: "enabledVengeanceModifiers" },
];

const DEFAULT_CUSTOM: GameCustomConfig = {
  enabledSpecials: ["freeze", "flip three", "second chance"],
  enabledSpecialNumbers: [],
  enabledVengeanceModifiers: [],
};

export function GameLobby() {
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");
  const [view, setView] = useState<"join" | "create" | "game">("join");
  const [showRules, setShowRules] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [customConfig, setCustomConfig] = useState<GameCustomConfig>(DEFAULT_CUSTOM);
  const { socket, gameState, isCreatingRoom, createGame, joinGame, startGame } = useSocket();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isCreatingRoom) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % t.loadingMessages.length);
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isCreatingRoom, t.loadingMessages.length]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (roomParam) {
      setGameId(roomParam);
      setView("join");
    }
  }, []);

  const toggleCard = (card: CardDef) => {
    setCustomConfig((prev) => {
      const list = prev[card.configKey] as string[];
      const updated = list.includes(card.value)
        ? list.filter((v) => v !== card.value)
        : [...list, card.value];
      return { ...prev, [card.configKey]: updated };
    });
  };

  const setGroupAll = (cards: CardDef[], enabled: boolean) => {
    setCustomConfig((prev) => {
      const next = { ...prev };
      cards.forEach((card) => {
        const list = next[card.configKey] as string[];
        if (enabled && !list.includes(card.value)) {
          (next[card.configKey] as string[]) = [...list, card.value];
        } else if (!enabled) {
          (next[card.configKey] as string[]) = list.filter((v) => v !== card.value);
        }
      });
      return next;
    });
  };

  const isEnabled = (card: CardDef) =>
    (customConfig[card.configKey] as string[]).includes(card.value);

  const handleCreateGame = () => {
    if (!playerName) return;
    createGame(
      playerName,
      selectedMode,
      selectedMode === "custom" ? customConfig : undefined
    );
    setView("game");
  };

  const handleRestartGame = () => setView("join");

  const handleJoinGame = () => {
    if (!playerName || !gameId) return;
    joinGame(gameId, playerName);
    setView("game");
  };

  if (view === "game" && gameState && socket) {
    return <GameBoard gameState={gameState} socket={socket} handleRestartGame={handleRestartGame} />;
  }

  if (isCreatingRoom) {
    return (
      <div className="max-w-sm mx-auto animate-float-in">
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(168,85,247,0.3)",
            boxShadow: "0 0 30px rgba(168,85,247,0.15), inset 0 0 30px rgba(168,85,247,0.03)",
          }}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin" />
            <p className="text-purple-300 font-bold text-base tracking-wide">
              {t.loadingMessages[loadingMsgIndex]}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t.loadingWakingUp}
              <br />
              <span className="text-yellow-400 font-medium">{t.loadingStayOnPage}</span>
            </p>
          </div>
          <div className="border-t border-white/10" />
          <p className="text-xs text-purple-400 font-semibold text-center tracking-widest uppercase">
            {t.whileYouWait}
          </p>
          <div className="space-y-3 text-xs text-gray-400">
            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.objective}</p>
              <p>{t.objectiveText}</p>
            </div>
            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.yourTurn}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t.yourTurnItems[0] as string}</li>
                <li>
                  {(t.yourTurnItems[1] as string[])[0]}
                  <span className="text-white font-medium">{(t.yourTurnItems[1] as string[])[1]}</span>
                  {(t.yourTurnItems[1] as string[])[2]}
                </li>
                <li>
                  {(t.yourTurnItems[2] as string[])[0]}
                  <span className="text-red-400 font-medium">{(t.yourTurnItems[2] as string[])[1]}</span>
                  {(t.yourTurnItems[2] as string[])[2]}
                </li>
              </ul>
            </div>
            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.flip7Title}</p>
              <p>
                {t.flip7Text[0]}
                <span className="text-white font-medium">{t.flip7Text[1]}</span>
                {t.flip7Text[2]}
                <span className="text-yellow-300 font-medium">{t.flip7Text[3]}</span>
                {t.flip7Text[4]}
              </p>
            </div>
            <div>
              <p className="text-purple-300 font-semibold mb-1">{t.scoringOrder}</p>
              <ol className="space-y-0.5 list-decimal list-inside">
                {(t.scoringItems as string[]).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Mode button style helper (compact, no desc inside) ── */
  const modeBtn = (
    mode: GameMode,
    icon: string,
    label: string,
    activeColor: { border: string; bg: string; dot: string; shadow: string }
  ) => (
    <button
      onClick={() => setSelectedMode(mode)}
      className={cn(
        "relative rounded-xl p-2.5 text-center transition-all duration-200 w-full",
        "border-2 focus:outline-none",
        selectedMode === mode
          ? `${activeColor.border} ${activeColor.bg} ${activeColor.shadow}`
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      )}
    >
      {selectedMode === mode && (
        <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${activeColor.dot}`} />
      )}
      <p className="text-lg mb-0.5">{icon}</p>
      <p className="text-xs font-bold text-white leading-tight">{label}</p>
    </button>
  );

  /* ── Card toggle row helper ── */
  const CardToggleGroup = ({
    labelKey,
    cards,
  }: {
    labelKey: string;
    cards: CardDef[];
  }) => {
    const allOn = cards.every(isEnabled);
    const allOff = cards.every((c) => !isEnabled(c));
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold">{(t as Record<string, string>)[labelKey]}</p>
          <div className="flex gap-1">
            <button
              onClick={() => setGroupAll(cards, true)}
              disabled={allOn}
              className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white disabled:opacity-30 transition-colors"
            >
              {t.customSelectAll}
            </button>
            <button
              onClick={() => setGroupAll(cards, false)}
              disabled={allOff}
              className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white disabled:opacity-30 transition-colors"
            >
              {t.customSelectNone}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cards.map((card) => {
            const on = isEnabled(card);
            return (
              <button
                key={card.value}
                onClick={() => toggleCard(card)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-150",
                  "border focus:outline-none",
                  on
                    ? "bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300"
                )}
              >
                <span>{card.icon}</span>
                <span>{card.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-sm mx-auto animate-float-in">
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(168,85,247,0.3)",
          boxShadow: "0 0 30px rgba(168,85,247,0.15), inset 0 0 30px rgba(168,85,247,0.03)",
        }}
      >
        {/* Section heading */}
        <div className="text-center mb-2">
          <span className="text-xs tracking-[0.2em] uppercase text-purple-400 font-semibold">
            {view === "join" ? t.joinGame : t.createGame}
          </span>
        </div>

        <Input
          placeholder={t.yourName}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className={cn(
            "w-full bg-white/10 border-purple-500/40 text-white placeholder:text-gray-500",
            "focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40",
            "rounded-xl h-12 text-base"
          )}
        />

        {view === "join" ? (
          <>
            <Input
              placeholder={t.gameCode}
              value={gameId}
              onChange={(e) => setGameId(e.target.value.toUpperCase())}
              className={cn(
                "w-full bg-white/10 border-purple-500/40 text-white placeholder:text-gray-500",
                "focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40",
                "rounded-xl h-12 text-base font-mono tracking-widest"
              )}
            />
            <Button
              onClick={handleJoinGame}
              disabled={!playerName || !gameId}
              className={cn(
                "w-full h-12 text-base font-bold rounded-xl transition-all duration-200",
                "bg-gradient-to-r from-purple-600 to-pink-600",
                "hover:from-purple-500 hover:to-pink-500",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
              )}
            >
              {t.joinGameBtn}
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("create")}
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl transition-all duration-200",
                "border-purple-500/40 text-purple-300 bg-transparent",
                "hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-200"
              )}
            >
              {t.createNewGame}
            </Button>
          </>
        ) : (
          <>
            {/* ── Mode selector ── */}
            <div className="space-y-2">
              <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase text-center">
                {t.gameMode}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {modeBtn("classic", "🃏", t.modeClassic, {
                  border: "border-purple-400", bg: "bg-purple-500/20", dot: "bg-purple-400",
                  shadow: "shadow-[0_0_16px_rgba(168,85,247,0.4)]",
                })}
                {modeBtn("vengeance", "⚔️", t.modeVengeance, {
                  border: "border-red-400", bg: "bg-red-500/20", dot: "bg-red-400",
                  shadow: "shadow-[0_0_16px_rgba(239,68,68,0.4)]",
                })}
                {modeBtn("custom", "⚙️", t.modeCustom, {
                  border: "border-amber-400", bg: "bg-amber-500/15", dot: "bg-amber-400",
                  shadow: "shadow-[0_0_16px_rgba(245,158,11,0.35)]",
                })}
              </div>
              <p className="text-xs text-gray-400 leading-snug px-0.5">
                {selectedMode === "classic"
                  ? t.modeClassicDesc
                  : selectedMode === "vengeance"
                  ? t.modeVengeanceDesc
                  : t.modeCustomDesc}
              </p>
            </div>

            {/* ── Custom card picker ── */}
            {selectedMode === "custom" && (
              <div
                className="rounded-xl p-3 space-y-3"
                style={{
                  background: "rgba(245,158,11,0.05)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <p className="text-xs text-amber-400 font-bold tracking-widest uppercase text-center">
                  {t.customCardsTitle}
                </p>
                <CardToggleGroup labelKey="customGroupClassic" cards={CLASSIC_SPECIALS} />
                <div className="border-t border-white/5" />
                <CardToggleGroup labelKey="customGroupVengeanceAction" cards={VENGEANCE_ACTION} />
                <div className="border-t border-white/5" />
                <CardToggleGroup labelKey="customGroupVengeanceNumber" cards={VENGEANCE_NUMBERS} />
                <div className="border-t border-white/5" />
                <CardToggleGroup labelKey="customGroupVengeanceMod" cards={VENGEANCE_MODS} />
              </div>
            )}

            {/* ── Create button ── */}
            <Button
              onClick={handleCreateGame}
              disabled={!playerName}
              className={cn(
                "w-full h-12 text-base font-bold rounded-xl transition-all duration-200",
                selectedMode === "vengeance"
                  ? "bg-gradient-to-r from-red-700 to-orange-600 hover:from-red-600 hover:to-orange-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
                  : selectedMode === "custom"
                  ? "bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {t.createGameBtn}
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("join")}
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl transition-all duration-200",
                "border-purple-500/40 text-purple-300 bg-transparent",
                "hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-200"
              )}
            >
              {t.joinExistingGame}
            </Button>
          </>
        )}

        {/* ── Rules hint ── */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            {t.gameHint}
          </p>
          <button
            onClick={() => setShowRules((s) => !s)}
            className="mt-2 w-full text-xs text-purple-400 hover:text-purple-300 transition-colors text-center"
          >
            {showRules ? t.hideRules : t.howToPlay}
          </button>

          {showRules && (
            <div className="mt-3 space-y-3 text-xs text-gray-400">
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.objective}</p>
                <p>{t.objectiveText}</p>
              </div>
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.yourTurn}</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t.yourTurnItems[0] as string}</li>
                  <li>
                    {(t.yourTurnItems[1] as string[])[0]}
                    <span className="text-white font-medium">{(t.yourTurnItems[1] as string[])[1]}</span>
                    {(t.yourTurnItems[1] as string[])[2]}
                  </li>
                  <li>
                    {(t.yourTurnItems[2] as string[])[0]}
                    <span className="text-red-400 font-medium">{(t.yourTurnItems[2] as string[])[1]}</span>
                    {(t.yourTurnItems[2] as string[])[2]}
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.flip7Title}</p>
                <p>
                  {t.flip7Text[0]}
                  <span className="text-white font-medium">{t.flip7Text[1]}</span>
                  {t.flip7Text[2]}
                  <span className="text-yellow-300 font-medium">{t.flip7Text[3]}</span>
                  {t.flip7Text[4]}
                </p>
              </div>
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.cardTypes}</p>
                <ul className="space-y-1">
                  {(t.cardTypeItems as string[][]).map((item, i) => (
                    <li key={i}>
                      <span className={i === 0 ? "text-white font-medium" : i === 1 ? "text-green-400 font-medium" : "text-yellow-300 font-medium"}>
                        {item[0]}
                      </span>
                      {item[1]}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.specialCards}</p>
                <ul className="space-y-1">
                  {(t.specialCardItems as string[][]).map((item, i) => {
                    const colors = ["text-cyan-400","text-orange-400","text-pink-400","text-red-400","text-emerald-400","text-violet-400","text-slate-400","text-teal-400"];
                    return (
                      <li key={i}>
                        <span className={`${colors[i] ?? "text-purple-300"} font-medium`}>{item[0]}</span>
                        {item[1]}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="text-purple-300 font-semibold mb-1">{t.scoringOrder}</p>
                <ol className="space-y-0.5 list-decimal list-inside">
                  {(t.scoringItems as string[]).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
