
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
   const { url, customAlias, expiresInDays } = req.body;
   let expiresAt = null;

if (expiresInDays) {
  const days = Number(expiresInDays);

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return res.status(400).json({
      message: "Expiration must be between 1 and 365 days.",
    });
  }

  expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
}

    if (!url) {
      return res.status(400).json({
        message: "Please provide a URL.",
      });
    }

    // Validate the original URL
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({
        message: "Please enter a valid URL.",
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        message: "Only HTTP and HTTPS URLs are allowed.",
      });
    }

    let shortId;

    if (customAlias && customAlias.trim()) {
      shortId = customAlias.trim();

      // Allow letters, numbers, hyphens, and underscores
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(shortId)) {
        return res.status(400).json({
          message:
            "Custom alias must be 3–30 characters and contain only letters, numbers, hyphens, or underscores.",
        });
      }

      const existingUrl = await Url.findOne({ shortId });

      if (existingUrl) {
        return res.status(409).json({
          message: "This custom alias is already taken.",
        });
      }
    } else {
      const { nanoid } = await import("nanoid");
      shortId = nanoid(7);
    }

    const newUrl = await Url.create({
    shortId,
     redirectURL: parsedUrl.href,
    createdBy: req.userId,
     visitHistory: [],
        expiresAt,
    });
    return res.status(201).json({
      message: "Short URL created successfully.",
      url: newUrl,
      shortUrl: `http://localhost:5000/${shortId}`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This short URL is already taken. Try another alias.",
      });
    }

    console.error("Create URL error:", error);

    return res.status(500).json({
      message: "Server error while creating the short URL.",
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

const mongoose = require("mongoose");

// Delete a URL belonging to the logged-in user
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid URL ID"
            });
        }

        const deletedUrl = await Url.findOneAndDelete({
            _id: id,
            createdBy: req.userId
        });

        if (!deletedUrl) {
            return res.status(404).json({
                message: "URL not found"
            });
        }

        return res.status(200).json({
            message: "URL deleted successfully"
        });
    } catch (error) {
        console.error("Delete URL error:", error.message);

        return res.status(500).json({
            message: "Could not delete URL"
        });
    }
});

module.exports = router;
