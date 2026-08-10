const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
  explainProblem,
  analyzeComplexity,
  generateHint,
  generateTestcases,
  dryRunCode,
  aiCoder,
} = require("../controllers/aiController");

router.post("/explain", protect, explainProblem);
router.post("/complexity", protect, analyzeComplexity);
router.post("/hint", protect, generateHint);
router.post("/generate-testcases", protect, requireRole("admin"), generateTestcases);
router.post("/dry-run", protect, dryRunCode);
router.post("/code", protect, aiCoder);

module.exports = router;
