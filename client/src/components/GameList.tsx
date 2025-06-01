import { useEffect, useState } from "react";
import GameCard from "./GameCard";
import GameDetailsModal from "./GameDetailsModal";
import { Game } from "../types/game";

const GameList = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [games, setGames] = useState<Game[]>([]);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [page, setPage] = useState(1);
    const [genre, setGenre] = useState("");
    const [loading, setLoading] = useState(false);
    const [allGenres, setAllGenres] = useState<string[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchGames = async () => {
            setLoading(true);
            setGames([]);

            try {
                const queryParams = new URLSearchParams();
                queryParams.append("page", page.toString());
                if (genre) queryParams.append("genre", genre);

                const res = await fetch(
                    `http://localhost:3000/api/games?${queryParams.toString()}`,
                    {
                        signal,
                    }
                );
                const gamesFromBackend: Game[] = await res.json();
                setGames(gamesFromBackend);

                const genreSet = new Set<string>();
                gamesFromBackend.forEach((game) => {
                    game.genres.forEach((g) => genreSet.add(g));
                });
                setAllGenres(Array.from(genreSet).sort());
            } catch (error) {
                if (signal.aborted) return;
                console.error("Error fetching games:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();

        return () => {
            controller.abort();
        };
    }, [page, genre]);

    return (
        <div className="flex flex-col items-center px-4">
            <div className="mt-4">
                <label className="mr-2">Filter by Genre:</label>
                <select
                    value={genre}
                    onChange={(e) => {
                        setGenre(e.target.value);
                        setPage(1);
                    }}
                    className="px-2 py-1 border rounded"
                >
                    <option value="">All</option>
                    {allGenres.map((g, idx) => (
                        <option key={idx} value={g}>
                            {g}
                        </option>
                    ))}
                </select>
            </div>

            <div className="w-full max-w-3xl mt-6 space-y-4 overflow-y-auto">
                {loading ? (
                    <div className="text-center mt-6 text-gray-500">
                        Loading games...
                    </div>
                ) : (
                    games.map((game, index) => (
                        <div key={index}>
                            <GameCard
                                {...game}
                                onClick={() => {
                                    setSelectedGame(game);
                                    setModalOpen(true);
                                }}
                            />
                        </div>
                    ))
                )}

                {selectedGame && (
                    <GameDetailsModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        game={selectedGame}
                    />
                )}
            </div>

            <div className="flex gap-4 mt-6 mb-6">
                <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 cursor-pointer"
                >
                    Previous
                </button>
                <button
                    disabled={games.length < 10}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 cursor-pointer"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default GameList;
