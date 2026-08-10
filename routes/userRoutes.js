const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getLeaderboard } = require("../controllers/userController");

router.get("/leaderboard", protect, getLeaderboard);

module.exports = router;
