import { useState } from "react";
import GameCard from "./GameCard";
import GameDetailsModal from "./GameDetailsModal";

const dummyGames = [
    {
        imageSrc: "https://placehold.co/600x400",
        name: "Elden Ring",
        genres: ["RPG", "Open World", "Souls-like"],
        released: true,
        userRating: 92,
        description:
            "Elden Ring is a massive action-RPG set in a dark fantasy world, featuring challenging combat and expansive exploration.",
        similarGames: [
            "https://placehold.co/600x400",
            "https://placehold.co/600x400",
            "https://placehold.co/600x400",
        ],
    },

    {
        imageSrc: "https://placehold.co/600x400",
        name: "Arma 3",
        genres: ["RPG", "Open World", "Souls-like"],
        released: true,
        userRating: 92,
        description:
            "Arma 3 is a massive action-RPG set in a dark fantasy world, featuring challenging combat and expansive exploration.",
        similarGames: [
            "https://placehold.co/600x400",
            "https://placehold.co/600x400",
            "https://placehold.co/600x400",
        ],
    },
];

const GameList = () => {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <div className="flex justify-center px-4">
            <div className="w-full max-w-3xl mt-6 space-y-4 overflow-y-auto">
                {dummyGames.map((game, index) => (
                    <div key={index}>
                        <GameCard
                            {...game}
                            onClick={() => setModalOpen(true)}
                        />
                        <GameDetailsModal
                            isOpen={modalOpen}
                            onClose={() => setModalOpen(false)}
                            game={game}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameList;
