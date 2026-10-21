
const express = require("express");
const Url = require("../models/Url");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

let generateId;

async function getGenerator() {
    if (!generateId) {
        const { nanoid } = await import("nanoid");
        generateId = nanoid;
    }

    return generateId;
}

// Create a short URL
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                message: "URL is required"
            });
        }

        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({
                message: "Please enter a valid URL"
            });
        }

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return res.status(400).json({
                message: "Only HTTP and HTTPS URLs are allowed"
            });
        }

        const nanoid = await getGenerator();
        const shortId = nanoid(7);

        const newUrl = await Url.create({
            shortId,
            redirectURL: parsedUrl.href,
            createdBy: req.userId
        });

        return res.status(201).json({
            message: "Short URL created successfully",
            shortUrl: `http://localhost:5000/${newUrl.shortId}`,
            data: newUrl
        });
    } catch (error) {
        console.error("URL creation error:", error.message);

        return res.status(500).json({
            message: "Could not create short URL"
        });
    }
});

// Redirect to the original URL and record the click
router.get("/:shortId", async (req, res) => {
    try {
        const url = await Url.findOne({
            shortId: req.params.shortId
        });

        if (!url) {
            return res.status(404).send("Short URL not found");
        }

        url.visitHistory.push({ timestamp: new Date() });
        await url.save();

        return res.redirect(url.redirectURL);
    } catch (error) {
        console.error("Redirect error:", error.message);

        return res.status(500).send("Something went wrong");
    }
});

// Get the current user's URLs
router.get("/", authenticateToken, async (req, res) => {
    try {
        const urls = await Url.find({
            createdBy: req.userId
        }).sort({ createdAt: -1 });

        return res.json({ urls });
    } catch (error) {
        return res.status(500).json({
            message: "Could not fetch URLs"
        });
    }
});

module.exports = router;
