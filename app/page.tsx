import { GameLobby } from "@/components/game-lobby";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold text-white text-center">
          FLIP7 Online
        </h1>
        <a className="text-white hover:text-gray-300" href="https://github.com/EzeLamar" target="_blank">Developed by Ezequiel Lamarque</a>
        </div>
        <GameLobby />
      </div>
    </div>
  );
}
