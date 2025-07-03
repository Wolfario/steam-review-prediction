import { useEffect, useState } from "react";

const Header = () => {
    const [statusMessage, setStatusMessage] = useState("");
    const [isTraining, setIsTraining] = useState(false);

    useEffect(() => {
        const checkInitialStatus = async () => {
            try {
                const res = await fetch("http://localhost:8000/status");
                const data = await res.json();
                console.log("Initial status check:", data);

                if (data.status === "ready") {
                    setStatusMessage("✅ Model is already trained and ready.");
                }
            } catch (error) {
                console.error("Error checking initial status:", error);
            }
        };

        checkInitialStatus();
    }, []);

    const startTraining = async () => {
        setIsTraining(true);
        setStatusMessage("⏳ Starting training...");

        try {
            const res = await fetch("http://localhost:8000/train", {
                method: "POST",
            });
            const data = await res.json();
            setStatusMessage(data.status || "⏳ Training started!");

            const intervalId = setInterval(async () => {
                try {
                    const statusRes = await fetch(
                        "http://localhost:8000/status"
                    );
                    const statusData = await statusRes.json();
                    console.log("Polling status:", statusData);

                    if (statusData.status === "ready") {
                        clearInterval(intervalId);
                        setStatusMessage("✅ Model is ready!");
                        setIsTraining(false);
                    }
                } catch (error) {
                    console.error("Error checking status:", error);
                }
            }, 5000);
        } catch (error) {
            setStatusMessage("❌ Training failed!");
            setIsTraining(false);
            console.error("Error starting training:", error);
        }
    };

    return (
        <header className="w-full bg-gray-900 text-white shadow-md py-6 px-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between">
                <h1 className="text-3xl font-bold mb-4 sm:mb-0">
                    Steam Review Score Predictor
                </h1>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button
                        onClick={startTraining}
                        disabled={isTraining}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
                            isTraining
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                    >
                        {isTraining ? "Training..." : "Start Training"}
                    </button>

                    {statusMessage && (
                        <p
                            className={`text-sm font-medium ${
                                statusMessage.includes("ready")
                                    ? "text-green-400"
                                    : statusMessage.includes("failed")
                                    ? "text-red-400"
                                    : "text-yellow-300"
                            }`}
                        >
                            {statusMessage}
                        </p>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
