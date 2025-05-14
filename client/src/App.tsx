import "./App.css";
import GameList from "./components/GameList";
import Header from "./components/Header";

function App() {
    return (
        <>
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <GameList />
                </main>
            </div>
        </>
    );
}

export default App;
