
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://gnews.io/api/v4";

app.get("/api/news", async (req, res) => {
    try {
        const category = req.query.category || "general";
        const search = req.query.q;

        const params = new URLSearchParams({
            lang: "en",
            country: "in",
            max: "10",
            apikey: process.env.GNEWS_API_KEY
        });

        const endpoint = search ? "search" : "top-headlines";

        if (search) {
            params.set("q", search);
        } else {
            params.set("category", category);
        }

        const response = await fetch(
            `${BASE_URL}/${endpoint}?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error("News API Error:", error);
        res.status(500).json({
            message: "Unable to fetch news"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`DailyPulse backend running on port ${PORT}`);
});