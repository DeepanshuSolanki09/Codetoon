const Problem = require("../models/Problem");

exports.createProblem = async (req, res) => {
  try {
    const { title, description, difficulty, testCases, memoryLimit, timeLimit } = req.body;

    const existingProblem = await Problem.findOne({ title });
    if (existingProblem) {
      return res.status(400).json({ 
        success: false, 
        message: "Problem title already exists." 
      });
    }

    if (!Array.isArray(testCases) || !testCases.length) {
      return res.status(400).json({ 
        success: false, 
        message: "Provide at least one testcase." 
      });
    }

    const problem = await Problem.create({
      title,
      description,
      difficulty,
      testCases,
      memoryLimit: memoryLimit || 256,
      timeLimit: timeLimit || 2000,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, problem });
  } catch (error) {
    console.error("Create Problem Error:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error creating problem." 
    });
  }
};

exports.getAllProblems = async (req, res) => {
  try {
    const { difficulty, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (difficulty) query.difficulty = difficulty;
    if (search) query.title = { $regex: search, $options: "i" };

    const p = Number(page);
    const l = Number(limit);
    const skip = (p - 1) * l;

    const [problems, totalProblems] = await Promise.all([
      Problem.find(query)
        .select("title difficulty memoryLimit timeLimit createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      Problem.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      totalProblems,
      totalPages: Math.ceil(totalProblems / l),
      currentPage: p,
      problems,
    });
  } catch (error) {
    console.error("Get All Problems Error:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error fetching problems." 
    });
  }
};

exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).lean();
    if (!problem) {
      return res.status(404).json({ 
        success: false, 
        message: "Problem not found." 
      });
    }

    problem.testCases = problem.testCases.filter(tc => !tc.isHidden);

    return res.status(200).json({ success: true, problem });
  } catch (error) {
    console.error("Get Problem By ID Error:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format.",
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: "Server error fetching problem." 
    });
  }
};

exports.updateProblem = async (req, res) => {
  try {
    const { title, description, difficulty, memoryLimit, timeLimit } = req.body;
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }
    if (title && title !== problem.title) {
      const existing = await Problem.findOne({ title });
      if (existing) {
        return res.status(400).json({ success: false, message: "Problem title already exists." });
      }
      problem.title = title;
    }
    if (description !== undefined) problem.description = description;
    if (difficulty !== undefined) problem.difficulty = difficulty;
    if (memoryLimit !== undefined) problem.memoryLimit = memoryLimit;
    if (timeLimit !== undefined) problem.timeLimit = timeLimit;
    await problem.save();
    return res.status(200).json({ success: true, problem });
  } catch (error) {
    console.error("Update Problem Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error updating problem." });
  }
};

exports.deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }
    return res.status(200).json({ success: true, message: "Problem deleted successfully." });
  } catch (error) {
    console.error("Delete Problem Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error deleting problem." });
  }
};

exports.addTestcase = async (req, res) => {
  try {
    const { input, expectedOutput, isHidden, explanation } = req.body;
    if (input === undefined || expectedOutput === undefined) {
      return res.status(400).json({ success: false, message: "Missing input or expectedOutput." });
    }
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { $push: { testCases: { input, expectedOutput, isHidden, explanation } } },
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }
    return res.status(200).json({ success: true, problem });
  } catch (error) {
    console.error("Add Testcase Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error adding test case." });
  }
};

exports.updateTestcase = async (req, res) => {
  try {
    const updateFields = {};
    for (const [key, value] of Object.entries(req.body)) {
      updateFields[`testCases.$.${key}`] = value;
    }
    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, "testCases._id": req.params.testcaseId },
      { $set: updateFields },
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem or test case not found." });
    }
    return res.status(200).json({ success: true, problem });
  } catch (error) {
    console.error("Update Testcase Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error updating test case." });
  }
};

exports.deleteTestcase = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { $pull: { testCases: { _id: req.params.testcaseId } } },
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found." });
    }
    return res.status(200).json({ success: true, problem });
  } catch (error) {
    console.error("Delete Testcase Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error deleting test case." });
  }
};
