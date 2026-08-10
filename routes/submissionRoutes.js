const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { rateLimit } = require("../middleware/rateLimiter");
const {
  submitCode,
  getUserSubmissions,
  getProblemSubmissions,
  getSubmissionById,
} = require("../controllers/submissionController");

router.post("/submit", protect, rateLimit(60000, 20), submitCode);
router.get("/user", protect, getUserSubmissions);
router.get("/problem/:problemId", protect, getProblemSubmissions);
router.get("/:submissionId", protect, getSubmissionById);

module.exports = router;
