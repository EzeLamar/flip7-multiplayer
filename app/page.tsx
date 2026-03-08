import { BuyMeACoffeeButton } from "@/components/BuyMeACoffeeButton";
import { GameLobby } from "@/components/game-lobby";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080b14] relative overflow-hidden">
      {/* Animated background glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[30%] right-[-5%] w-80 h-80 bg-pink-600/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-cyan-600/15 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse [animation-delay:0.5s]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-4">
            <h1
              className="text-6xl md:text-8xl font-black tracking-widest text-white uppercase animate-title-glow"
              style={{
                textShadow:
                  "0 0 20px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4), 0 0 100px rgba(236,72,153,0.2)",
              }}
            >
              FLIP<span className="text-purple-400">7</span>
            </h1>
          </div>
          <p className="text-purple-300 text-sm md:text-base tracking-[0.3em] uppercase font-semibold opacity-80">
            Multiplayer Card Game
          </p>
          <div className="mt-1">
            <BuyMeACoffeeButton />
          </div>
        </div>

        {/* Lobby */}
        <GameLobby />
      </div>
    </div>
  );
}
