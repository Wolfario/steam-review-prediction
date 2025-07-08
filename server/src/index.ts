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
    const genre = req.query.genre as string | undefined;
    const releasedOnly = req.query.released === "true";
    const upcomingOnly = req.query.upcoming === "true";
    const search = req.query.search as string | undefined;
    const limit = 100;

    try {
        let query = `
            SELECT 
                "Name", 
                "Header image", 
                "Genres", 
                "Positive Percentage", 
                "About the game",
                "Upcoming status"
            FROM steam_games
        `;
        const conditions: string[] = [];
        const values: any[] = [];

        if (genre) {
            values.push(`%${genre}%`);
            conditions.push(`"Genres" ILIKE $${values.length}`);
        }

        if (releasedOnly) {
            values.push(false);
            conditions.push(`"Upcoming status" = $${values.length}`);
        }

        if (upcomingOnly) {
            values.push(true);
            conditions.push(`"Upcoming status" = $${values.length}`);
        }

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`"Name" ILIKE $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(" AND ");
        }

        values.push(limit);
        query += ` ORDER BY "Positive Percentage" DESC LIMIT $${values.length}`;

        const result = await pool.query(query, values);

        const games = result.rows.map((row) => ({
            name: row.Name,
            imageSrc: row["Header image"],
            genres: row.Genres
                ? row.Genres.split(",").map((g: string) => g.trim())
                : [],
            userRating: row["Positive Percentage"]
                ? row["Positive Percentage"].toFixed(2)
                : "0.00",
            description: row["About the game"] || "No description available.",
            released: row["Upcoming status"] === false,
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
                const res = await axios.post("http://localhost:8000/predict", {
                    genres: req.body.genres,
                    categories: req.body.categories,
                    about: req.body.about,
                    age: req.body.age,
                });
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
