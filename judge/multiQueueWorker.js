const { Worker } = require("bullmq");
const { createRedisConnection } = require("../config/redis");
const Submission = require("../models/Submission");
const Problem = require("../models/Problem");
const User = require("../models/User");
const { compileAndRun, cleanupFiles } = require("./compiler");
const { validateOutputFile } = require("./validator");

const processSubmissionJob = async (submissionId, isSampleOnly = false) => {
  const submission = await Submission.findById(submissionId);
  if (!submission) return;

  const problem = await Problem.findById(submission.problem);
  if (!problem) {
    submission.status = "Runtime Error";
    submission.errorMessage = "Associated problem not found";
    await submission.save();
    return;
  }

  const testCases = isSampleOnly
    ? problem.testCases.filter((tc) => !tc.isHidden)
    : problem.testCases || [];

  if (!testCases.length) {
    submission.status = "Runtime Error";
    submission.errorMessage = "No test cases available for evaluation";
    await submission.save();
    return;
  }

  let passedCount = 0;
  let maxTime = 0;
  let finalStatus = "Accepted";
  let firstError = "";

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let filesToCleanup = [];

    try {
      const runResult = await compileAndRun(
        submission.language,
        submission.code,
        tc.input,
        problem.timeLimit || 2000
      );

      filesToCleanup = runResult.filesToCleanup;
      maxTime = Math.max(maxTime, runResult.executionTime);

      const { isMatched, cleanActual, cleanExpected } = validateOutputFile(
        runResult.outputFilePath,
        tc.expectedOutput
      );

      cleanupFiles(filesToCleanup);
      filesToCleanup = [];

      if (isMatched) {
        passedCount++;
      } else {
        finalStatus = "Wrong Answer";
        firstError = `Testcase ${i + 1} Failed:\nExpected: "${cleanExpected}"\nGot: "${cleanActual}"`;
        break;
      }
    } catch (err) {
      if (filesToCleanup.length) {
        cleanupFiles(filesToCleanup);
      }
      finalStatus = err.status || "Runtime Error";
      firstError = err.errorMessage || "Execution error encountered";
      if (err.executionTime) maxTime = Math.max(maxTime, err.executionTime);
      break;
    }
  }

  submission.status = finalStatus;
  submission.testCasesPassed = passedCount;
  submission.totalTestCases = testCases.length;
  submission.executionTime = maxTime;
  submission.errorMessage = firstError;
  await submission.save();

  if (finalStatus === "Accepted" && !isSampleOnly) {
    await User.findByIdAndUpdate(submission.user, {
      $addToSet: { solvedProblems: problem._id },
    });
  }

  return { status: finalStatus, submissionId: submission._id };
};

const workerOptions = (concurrency) => ({
  connection: createRedisConnection(),
  concurrency,
});

const highPriorityWorker = new Worker(
  "high-priority-queue",
  async (job) => {
    return await processSubmissionJob(job.data.submissionId, true);
  },
  workerOptions(5)
);

const standardWorker = new Worker(
  "standard-submission-queue",
  async (job) => {
    return await processSubmissionJob(job.data.submissionId, false);
  },
  workerOptions(3)
);

const batchWorker = new Worker(
  "batch-rejudge-queue",
  async (job) => {
    return await processSubmissionJob(job.data.submissionId, false);
  },
  workerOptions(1)
);

const workers = [highPriorityWorker, standardWorker, batchWorker];

workers.forEach((worker) => {
  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });
});

module.exports = {
  highPriorityWorker,
  standardWorker,
  batchWorker,
  processSubmissionJob,
};
