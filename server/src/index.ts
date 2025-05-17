import express from "express";
import cors from "cors";
import pool from "./database/db";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Working.");
});

app.get("/api/games", async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT "Name" FROM steam_games LIMIT 5'
        );
        const gameNames = result.rows.map((row) => row.Name);
        console.log(gameNames);
        res.json(gameNames);
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).json({ error: "Failed to fetch games" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is up: http://localhost:${PORT}`);
});
