const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  addTestcase,
  updateTestcase,
  deleteTestcase,
} = require("../controllers/problemController");

router.get("/", getAllProblems);
router.get("/:id", getProblemById);
router.post("/", protect, requireRole("admin"), createProblem);
router.put("/:id", protect, requireRole("admin"), updateProblem);
router.delete("/:id", protect, requireRole("admin"), deleteProblem);
router.post("/:id/testcases", protect, requireRole("admin"), addTestcase);
router.put("/:id/testcases/:testcaseId", protect, requireRole("admin"), updateTestcase);
router.delete("/:id/testcases/:testcaseId", protect, requireRole("admin"), deleteTestcase);

module.exports = router;
