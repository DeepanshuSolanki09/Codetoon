const express = require("express");
const passport = require("passport");
const router = express.Router();

const { googleCallback, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${frontendURL}/auth-failure`,
    session: false,
  }),
  googleCallback
);

router.get("/me", protect, getMe);

module.exports = router;
