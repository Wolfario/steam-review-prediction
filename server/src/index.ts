import express from "express";
import cors from "cors";
import pool from "./database/db";
import axios from "axios";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Working.");
});

app.get("/api/games", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const genre = req.query.genre as string | undefined;
    const limit = 10;
    const offset = (page - 1) * limit;

    try {
        let query = `
            SELECT 
                "Name", 
                "Header image", 
                "Genres", 
                "User score", 
                "About the game" 
            FROM steam_games
        `;
        const values: any[] = [];

        if (genre) {
            query += ` WHERE "Genres" ILIKE $1`;
            values.push(`%${genre}%`);
        }

        query += ` ORDER BY "User score" DESC LIMIT $${
            values.length + 1
        } OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);

        console.log(result.rows);

        const games = result.rows.map((row) => ({
            name: row.Name,
            imageSrc: row["Header image"],
            genres: row.Genres
                ? row.Genres.split(",").map((g: string) => g.trim())
                : [],
            userRating: row["User score"] ? Math.round(row["User score"]) : 0,
            description: row["About the game"] || "No description available.",
            released: true,
            similarGames: [],
        }));

        res.json(games);
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).json({ error: "Failed to fetch games" });
    }
});

app.post("/api/predict", async (req, res) => {
    async function callPredictor(retries = 5) {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await axios.post(
                    "http://steam_predictor:8000/predict",
                    {
                        genres: req.body.genres,
                        categories: req.body.categories,
                        about: req.body.about,
                        age: req.body.age,
                    }
                );
                return res.data;
            } catch (err) {
                console.error(
                    `Predictor not available (attempt ${i + 1}), retrying...`
                );
                await new Promise((r) => setTimeout(r, 3000)); // wait 3 seconds
            }
        }
        throw new Error(
            "Predictor service is not available after several retries"
        );
    }

    try {
        const prediction = await callPredictor();
        res.json(prediction);
    } catch (error) {
        console.error("Prediction error:", error);
        res.status(500).json({ error: "Prediction failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is up: http://localhost:${PORT}`);
});
