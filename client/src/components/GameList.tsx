import { useEffect, useState } from "react";
import GameCard from "./GameCard";
import GameDetailsModal from "./GameDetailsModal";
import { Game } from "../types/game";
import { SimilarGame } from "../types/SimilarGame";

const GameList = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [genre, setGenre] = useState("");
    const [loading, setLoading] = useState(false);
    const [allGenres, setAllGenres] = useState<string[]>([]);
    const [gameDataMap, setGameDataMap] = useState<{
        [index: number]: {
            predictedRating: number | null;
            similarGames: SimilarGame[];
            loading: boolean;
            error: string | null;
        };
    }>({});
    const [modalIndex, setModalIndex] = useState<number | null>(null);
    const [releasedOnly, setReleasedOnly] = useState(false);
    const [upcomingOnly, setUpcomingOnly] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchGames = async () => {
            setLoading(true);
            setGames([]);

            try {
                const queryParams = new URLSearchParams();
                if (genre) {
                    queryParams.append("genre", genre);
                }
                if (releasedOnly) {
                    queryParams.append("released", "true");
                }
                if (upcomingOnly) {
                    queryParams.append("upcoming", "true");
                }

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
    }, [genre, releasedOnly, upcomingOnly]);

    const handlePredictAndSimilar = async (game: Game, index: number) => {
        setGameDataMap((prev) => ({
            ...prev,
            [index]: {
                predictedRating: null,
                similarGames: [],
                loading: true,
                error: null,
            },
        }));

        try {
            const statusRes = await fetch("http://localhost:8000/status");
            const statusData = await statusRes.json();

            if (statusData.status !== "ready") {
                throw new Error("Model is not ready yet.");
            }

            const predictRes = await fetch("http://localhost:8000/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    genres: game.genres.join(", "),
                    categories: "SomeCategory",
                    about: game.description,
                    age: 0,
                }),
            });
            const predictData = await predictRes.json();

            const similarityRes = await fetch(
                "http://localhost:8000/find_similarity",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        genres: game.genres.join(", "),
                        categories: "SomeCategory",
                        count: 5,
                    }),
                }
            );
            const similarityData = await similarityRes.json();

            setGameDataMap((prev) => ({
                ...prev,
                [index]: {
                    predictedRating: predictData.prediction,
                    similarGames: similarityData,
                    loading: false,
                    error: null,
                },
            }));
        } catch (err) {
            setGameDataMap((prev) => ({
                ...prev,
                [index]: {
                    predictedRating: null,
                    similarGames: [],
                    loading: false,
                    error: "Failed to predict or fetch similar games." + err,
                },
            }));
        }
    };

    const handleSearch = async (searchTerm: string) => {
        try {
            const res = await fetch(
                `http://localhost:3000/api/games?search=${searchTerm}`
            );
            const gamesFromBackend: Game[] = await res.json();
            setGames(gamesFromBackend);
        } catch (error) {
            console.error("Error fetching games:", error);
        }
    };

    return (
        <div className="flex flex-col items-center px-4">
            <form
                className="mt-4 flex flex-wrap gap-1 items-center"
                onSubmit={(e) => e.preventDefault()}
            >
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 border rounded w-64"
                />
                <button
                    onClick={() => handleSearch(searchTerm)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white text-sm font-semibold rounded transition disabled:opacity-50"
                    disabled={!searchTerm}
                >
                    Search
                </button>
            </form>

            <div className="mt-4">
                <label className="mr-2">Filter by Genre:</label>
                <select
                    value={genre}
                    onChange={(e) => {
                        setGenre(e.target.value);
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

                <label className="ml-4">
                    <input
                        type="checkbox"
                        checked={releasedOnly}
                        onChange={(e) => {
                            setReleasedOnly(e.target.checked);
                        }}
                        className="mr-2"
                    />
                    Released Only
                </label>

                <label className="ml-4">
                    <input
                        type="checkbox"
                        checked={upcomingOnly}
                        onChange={(e) => {
                            setUpcomingOnly(e.target.checked);
                        }}
                        className="mr-2"
                    />
                    Upcoming Only
                </label>
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
                                predictedRating={
                                    gameDataMap[index]?.predictedRating ??
                                    undefined
                                }
                                onClick={() => setModalIndex(index)}
                            />
                        </div>
                    ))
                )}

                {modalIndex !== null && (
                    <GameDetailsModal
                        isOpen={modalIndex !== null}
                        onClose={() => setModalIndex(null)}
                        game={games[modalIndex]}
                        predictedRating={
                            gameDataMap[modalIndex]?.predictedRating ?? null
                        }
                        similarGames={
                            gameDataMap[modalIndex]?.similarGames ?? []
                        }
                        loading={gameDataMap[modalIndex]?.loading ?? false}
                        error={gameDataMap[modalIndex]?.error ?? null}
                        onPredict={() =>
                            handlePredictAndSimilar(
                                games[modalIndex],
                                modalIndex
                            )
                        }
                    />
                )}
            </div>
        </div>
    );
};

export default GameList;
