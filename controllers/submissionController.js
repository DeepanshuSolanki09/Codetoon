const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const { enqueueSubmission } = require("../config/queueManager");

const SUPPORTED_LANGUAGES = ["cpp", "java", "python", "javascript", "go"];

exports.submitCode = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const normalizedLanguage = language.toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported programming language.",
      });
    }

    const problem = await Problem.findById(problemId).select("testCases");
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    const submission = await Submission.create({
      user: req.user._id,
      problem: problemId,
      code,
      language: normalizedLanguage,
      status: "Pending",
      totalTestCases: problem.testCases?.length || 0,
    });

    try {
      await enqueueSubmission(submission._id);
    } catch (queueError) {
      await Submission.findByIdAndUpdate(submission._id, {
        status: "Runtime Error",
        errorMessage: "Judge queue unavailable",
      });
      return res.status(503).json({
        success: false,
        message: "Judge queue unavailable. Please try again later.",
      });
    }

    return res.status(201).json({ success: true, submission });
  } catch (error) {
    console.error("Submit Code Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error processing submission.",
    });
  }
};

exports.getUserSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const skip = (p - 1) * l;

    const filter = { user: req.user._id };

    const [submissions, totalSubmissions] = await Promise.all([
      Submission.find(filter)
        .populate("problem", "title difficulty")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      totalSubmissions,
      totalPages: Math.ceil(totalSubmissions / l),
      currentPage: p,
      submissions,
    });
  } catch (error) {
    console.error("Get User Submissions Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching submissions.",
    });
  }
};

exports.getProblemSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      user: req.user._id,
      problem: req.params.problemId,
    })
      .select("-code")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error("Get Problem Submissions Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error fetching problem submissions.",
    });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate("problem", "title difficulty")
      .lean();
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found." });
    }
    if (submission.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    return res.status(200).json({ success: true, submission });
  } catch (error) {
    console.error("Get Submission By ID Error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format." });
    }
    return res.status(500).json({ success: false, message: "Server error fetching submission." });
  }
};
