const requestCounts = new Map();

const rateLimit = (windowMs = 60000, maxRequests = 30) => {
  return (req, res, next) => {
    const key = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const entry = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    requestCounts.set(key, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
};

module.exports = { rateLimit };
