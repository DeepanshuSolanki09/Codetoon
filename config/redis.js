const Redis = require("ioredis");

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
};

const createRedisConnection = () => new Redis(redisOptions);

const redisConnection = createRedisConnection();

redisConnection.on("connect", () => {
  console.log("Redis Connected Successfully");
});

redisConnection.on("error", (err) => {
  console.error("Redis Connection Error:", err.message);
});

module.exports = redisConnection;
module.exports.redisOptions = redisOptions;
module.exports.createRedisConnection = createRedisConnection;
