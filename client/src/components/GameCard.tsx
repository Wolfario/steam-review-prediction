import { useState } from "react";

interface GameCardProps {
    imageSrc: string;
    name: string;
    genres: string[];
    released: boolean;
    userRating: number;
    onClick?: () => void;
}

const GameCard = ({
    imageSrc,
    name,
    genres,
    released,
    userRating,
    onClick,
}: GameCardProps) => {
    const [loaded, setLoaded] = useState(false);

    const getRatingColor = () => {
        if (userRating == 0) return "No Rating";
        if (userRating >= 75) return "text-green-600";
        if (userRating >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    const getRatingLabel = () => {
        if (userRating == 0) return "No Rating";
        if (userRating >= 75) return "Very Positive";
        if (userRating >= 50) return "Mixed";
        return "Negative";
    };

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="relative w-32 h-20">
                    <img
                        src={imageSrc}
                        alt={name}
                        onLoad={() => setLoaded(true)}
                        className={`w-full h-full object-cover rounded-xl border border-gray-300 transition-all duration-500 ${
                            loaded ? "blur-0" : "blur-md scale-105"
                        }`}
                    />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        {name}
                    </h2>
                    <span
                        className={`inline-block mt-1 mb-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                            released
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                        {released ? "Released" : "Coming Soon"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {genres.map((genre, idx) => (
                            <span
                                key={idx}
                                className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap"
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <span className={`text-lg font-bold ${getRatingColor()}`}>
                    {userRating === 0 ? "N/A" : userRating + "%"}
                </span>
                <span className="text-xs text-gray-500">
                    {getRatingLabel()}
                </span>
            </div>
        </div>
    );
};

export default GameCard;
