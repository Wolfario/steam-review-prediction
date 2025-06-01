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

// app.post("/api/predict", async (req, res) => {
//     const { genres, categories, about, age } = req.body;
//     try {
//         const result = await pool.query("SELECT predict($1, $2, $3, $4)", [
//             genres,
//             categories,
//             about,
//             age,
//         ]);
//         res.json({ prediction: result.rows[0].predict });
//     } catch (error) {
//         console.error("Error making prediction:", error);
//         res.status(500).json({ error: "Failed to make prediction" });
//     }
// });

app.listen(PORT, () => {
    console.log(`Server is up: http://localhost:${PORT}`);
});
