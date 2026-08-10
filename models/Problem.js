const mongoose = require("mongoose");

const testcaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  },
  isHidden: {
    type: Boolean,
    default: true,
  },
  explanation: {
    type: String,
  },
});

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  testCases: {
    type: [testcaseSchema],
    validate: [(val) => Array.isArray(val) && val.length > 0, "Problem must have at least one test case"],
  },
  memoryLimit: {
    type: Number,
    default: 256,
  },
  timeLimit: {
    type: Number,
    default: 2000,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
},{
    timestamps: true,
});

problemSchema.index({ difficulty: 1 });

module.exports = mongoose.model("Problem", problemSchema);