const { exec } = require("child_process");
const fs = require("fs");

const runInSandbox = (command, inputFilePath, outputFilePath, timeLimit = 2000) => {
  return new Promise((resolve, reject) => {
    if (outputFilePath) {
      fs.writeFileSync(outputFilePath, "");
    }

    const fullCommand = inputFilePath && outputFilePath
      ? `${command} < "${inputFilePath}" > "${outputFilePath}"`
      : inputFilePath
        ? `${command} < "${inputFilePath}"`
        : outputFilePath
          ? `${command} > "${outputFilePath}"`
          : command;

    const startTime = process.hrtime();

    exec(
      fullCommand,
      {
        timeout: timeLimit,
        maxBuffer: 1024 * 1024 * 5,
        shell: true,
      },
      (error, stdout, stderr) => {
        const endTime = process.hrtime(startTime);
        const executionTime = Math.round(
          endTime[0] * 1000 + endTime[1] / 1000000
        );

        if (error) {
          if (error.killed || error.signal === "SIGTERM") {
            return reject({
              status: "Time Limit Exceeded",
              errorMessage: `Execution timed out after ${timeLimit}ms`,
              executionTime: timeLimit,
            });
          }

          const isCompileError =
            stderr &&
            (stderr.includes("error:") ||
              stderr.includes("Error:") ||
              stderr.includes("syntax error"));

          return reject({
            status: isCompileError ? "Compilation Error" : "Runtime Error",
            errorMessage: stderr || error.message,
            executionTime,
          });
        }

        resolve({ executionTime });
      }
    );
  });
};

module.exports = { runInSandbox };
