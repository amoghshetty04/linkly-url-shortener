
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const urlRoutes = require("./routes/urlRoutes");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Linkly backend is running!");
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Linkly API is working!"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/urls", urlRoutes);
const Url = require("./models/Url");

app.get("/:shortId", async (req, res) => {
    try {
        const url = await Url.findOne({
            shortId: req.params.shortId
        });

        if (!url) {
            return res.status(404).send("Short URL not found");
        }

        url.visitHistory.push({
            timestamp: new Date()
        });

        await url.save();

        return res.redirect(url.redirectURL);
    } catch (error) {
        console.error("Redirect error:", error);
        return res.status(500).send("Something went wrong");
    }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
