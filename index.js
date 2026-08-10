const express = require("express");
const passport = require("passport");
require("dotenv").config();

require("./config/passport");

const connectDB = require("./config/db");

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/problems", require("./routes/problemRoutes"));
app.use("/api/v1/submissions", require("./routes/submissionRoutes"));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/ai", require("./routes/aiRoutes"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(500).json({
    success: false,
    message: "Something went wrong on our end.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const workers = require("./judge/multiQueueWorker");

  const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

  const shutdown = async () => {
    server.close();
    await Promise.all([
      workers.highPriorityWorker.close(),
      workers.standardWorker.close(),
      workers.batchWorker.close(),
    ]);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer().catch((err) => {
  console.error("Server startup failure:", err.message);
  process.exit(1);
});
