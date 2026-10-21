
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const urlRoutes = require("./routes/urlRoutes");
const connectDB = require("./config/db");
const Url = require("./models/Url");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Linkly backend is running!");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Linkly API is working!",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/urls", urlRoutes);

// Redirect short URLs

app.get("/:shortId", async (req, res) => {
  try {
    const url = await Url.findOne({
      shortId: req.params.shortId,
    });

    // 1. Check whether the short URL exists
    if (!url) {
      return res.status(404).send("Short URL not found");
    }

    // 2. Check whether the short URL has expired
    if (url.expiresAt && url.expiresAt <= new Date()) {
      return res.status(410).send("This short URL has expired.");
    }

    // 3. Record the visit
    url.visitHistory.push({
      timestamp: new Date(),
    });

    await url.save();

    // 4. Redirect to the original URL
    return res.redirect(url.redirectURL);
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).send("Something went wrong");
  }
});


// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
