import { GameLobby } from "@/components/game-lobby";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          FLIP7 Online
        </h1>
        <GameLobby />
      </div>
    </div>
  );
}
