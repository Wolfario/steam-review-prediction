import { Game } from "../types/game";
import SimilarGameCard from "./SimilarGameCard";
import { SimilarGame } from "../types/SimilarGame";

interface GameDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    game: Game;

    predictedRating: number | null;
    similarGames: SimilarGame[];
    loading: boolean;
    error: string | null;
    onPredict: () => void;
}

const GameDetailsModal = ({
    isOpen,
    onClose,
    game,
    predictedRating,
    similarGames,
    loading,
    error,
    onPredict,
}: GameDetailsModalProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative overflow-hidden">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 cursor-pointer hover:text-gray-900 text-3xl leading-none"
                >
                    &times;
                </button>

                {/* Game info section */}
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <img
                        src={game.imageSrc}
                        alt={game.name}
                        className="w-full md:w-40 h-40 object-cover rounded-xl border border-gray-300 shadow-sm"
                    />
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {game.name}
                        </h2>
                        <p className="text-sm mt-1">
                            {game.released ? (
                                <span className="text-green-600 font-medium">
                                    Released
                                </span>
                            ) : (
                                <span className="text-yellow-600 font-medium">
                                    Coming Soon
                                </span>
                            )}
                        </p>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {game.genres.map((genre, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>

                        {/* Description */}
                        <p className="text-sm mt-4 text-gray-700 line-clamp-4">
                            {game.description}
                        </p>

                        {/* Predict button */}
                        <button
                            onClick={onPredict}
                            disabled={loading}
                            className="mt-5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                        >
                            {loading
                                ? "Loading..."
                                : "Predict AI Rating & Find Similar Games"}
                        </button>

                        {/* Rating/Error */}
                        {predictedRating !== null && (
                            <p className="mt-2 text-sm font-medium text-gray-800">
                                Predicted Rating:{" "}
                                <span className="text-indigo-700">
                                    {predictedRating}
                                </span>
                            </p>
                        )}

                        {error && (
                            <p className="mt-2 text-sm text-red-600 font-medium">
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Similar games */}
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Similar Games
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                    {similarGames.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No similar games found.
                        </p>
                    ) : (
                        similarGames.map((simGame) => (
                            <SimilarGameCard
                                key={simGame.AppID}
                                imageSrc={simGame.Name ? "" : ""} // Replace with image URL logic if you have one
                                name={simGame.Name}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameDetailsModal;
