interface SimilarGameCardProps {
    imageSrc: string;
    name: string;
    onClick?: () => void;
}

const SimilarGameCard = ({ imageSrc, name, onClick }: SimilarGameCardProps) => {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-shadow"
        >
            <img
                src={imageSrc}
                alt={name}
                className="w-auto h-24 object-cover"
            />
        </div>
    );
};

export default SimilarGameCard;
