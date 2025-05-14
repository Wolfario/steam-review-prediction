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
    const getRatingColor = () => {
        if (userRating >= 75) return "text-green-600";
        if (userRating >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    const getRatingLabel = () => {
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
                <img
                    src={imageSrc}
                    alt={name}
                    className="w-auto h-20 object-cover rounded-xl border border-gray-300"
                />
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
                    {userRating}%
                </span>
                <span className="text-xs text-gray-500">
                    {getRatingLabel()}
                </span>
            </div>
        </div>
    );
};

export default GameCard;
