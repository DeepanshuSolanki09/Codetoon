const User = require("../models/User");

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $project: {
          username: 1,
          email: 1,
          solvedCount: { $size: { $ifNull: ["$solvedProblems", []] } }
        }
      },
      { $sort: { solvedCount: -1 } }
    ]);
    return res.status(200).json({ success: true, leaderboard: users });
  } catch (error) {
    console.error("Get Leaderboard Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching leaderboard." });
  }
};
