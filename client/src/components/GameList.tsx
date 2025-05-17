import { useEffect, useState } from "react";
import GameCard from "./GameCard";
import GameDetailsModal from "./GameDetailsModal";
import { Game } from "../types/game";

const GameList = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchGames = async () => {
            try {
                const res = await fetch("http://localhost:3000/api/games", {
                    signal,
                });
                const gameNames: string[] = await res.json();

                // You can expand real data here if your backend sends more fields
                const mappedGames: Game[] = gameNames.map((name) => ({
                    name,
                    imageSrc: "https://placehold.co/600x400", // Placeholder until backend provides images
                    genres: ["Unknown"],
                    released: true,
                    userRating: 0,
                    description: "No description available.",
                    similarGames: [
                        "https://placehold.co/600x400",
                        "https://placehold.co/600x400",
                        "https://placehold.co/600x400",
                    ],
                }));

                setGames(mappedGames);
            } catch (error) {
                if (signal.aborted) return;
                console.error("Error fetching games:", error);
            }
        };

        fetchGames();

        return () => {
            controller.abort();
        };
    }, []);

    return (
        <div className="flex justify-center px-4">
            <div className="w-full max-w-3xl mt-6 space-y-4 overflow-y-auto">
                {games.map((game, index) => (
                    <div key={index}>
                        <GameCard
                            {...game}
                            onClick={() => {
                                setSelectedGame(game);
                                setModalOpen(true);
                            }}
                        />
                    </div>
                ))}

                {selectedGame && (
                    <GameDetailsModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        game={selectedGame}
                    />
                )}
            </div>
        </div>
    );
};

export default GameList;
