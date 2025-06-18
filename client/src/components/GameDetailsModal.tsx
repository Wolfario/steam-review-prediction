import { useState } from "react";
import { Game } from "../types/game";
import SimilarGameCard from "./SimilarGameCard";

interface GameDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    game: Game;
}

const GameDetailsModal = ({ isOpen, onClose, game }: GameDetailsModalProps) => {
    const [predictedRating, setPredictedRating] = useState(0);

    if (!isOpen) {
        return null;
    }

    const predictRating = async () => {
        const body = {
            genres: game.genres.join(","),
            categories: "SomeCategory",
            about: game.description,
            age: 0, // Replace with actual age if needed
        };

        const res = await fetch("http://localhost:3000/api/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        setPredictedRating(data.prediction);
        console.log("Prediction:", data.prediction);
    };

    return (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-xl relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-black text-3xl cursor-pointer"
                >
                    &times;
                </button>

                {/* Game info */}
                <div className="flex gap-4 mb-4">
                    <img
                        src={game.imageSrc}
                        alt={game.name}
                        className="w-auto h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <div>
                        <h2 className="text-2xl font-semibold">{game.name}</h2>
                        <p className="text-sm mt-1">
                            {game.released ? (
                                <span className="text-green-600">Released</span>
                            ) : (
                                <span className="text-yellow-600">
                                    Coming Soon
                                </span>
                            )}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {game.genres.map((genre, index) => (
                                <span
                                    key={index}
                                    className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm mt-3 text-gray-700">
                            {game.description}
                        </p>
                        <button
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 transition"
                            onClick={() => predictRating()}
                        >
                            Predict AI Rating
                        </button>
                        {predictedRating > 0 ? (
                            <p className="mt-2">
                                Predicted Rating: {predictedRating}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Similar games */}
                <h3 className="text-lg font-semibold mb-2">Similar Games</h3>
                <div className="flex gap-3 overflow-x-auto">
                    {game.similarGames.map((img, index) => (
                        <SimilarGameCard
                            key={index}
                            imageSrc={img}
                            name={game.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameDetailsModal;
