
const express = require("express");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong"
        });
    }
});

module.exports = router;
