const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

exports.googleCallback = (req, res) => {
  try {
    const token = generateToken(req.user._id, req.user.role);
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

    return res.redirect(`${frontendURL}/auth-success?token=${token}`);
  } catch (error) {
    console.error("Token Generation Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    });
  }
};

exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
