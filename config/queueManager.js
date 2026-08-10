const { Queue } = require("bullmq");
const { createRedisConnection } = require("./redis");

const standardQueue = new Queue("standard-submission-queue", {
  connection: createRedisConnection(),
});

const highPriorityQueue = new Queue("high-priority-queue", {
  connection: createRedisConnection(),
});

const batchQueue = new Queue("batch-rejudge-queue", {
  connection: createRedisConnection(),
});

const enqueueSubmission = async (submissionId, priority = "standard") => {
  const queueMap = {
    high: highPriorityQueue,
    standard: standardQueue,
    batch: batchQueue,
  };

  const queue = queueMap[priority] || standardQueue;

  await queue.add(
    "judge-submission",
    { submissionId: submissionId.toString() },
    {
      removeOnComplete: 100,
      removeOnFail: 200,
    }
  );
};

module.exports = {
  enqueueSubmission,
  standardQueue,
  highPriorityQueue,
  batchQueue,
};
