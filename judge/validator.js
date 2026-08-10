const fs = require("fs");

const normalizeOutput = (str) => {
  if (!str) return "";
  return str
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
};

const validateOutput = (actualOutput, expectedOutput) => {
  const cleanActual = normalizeOutput(actualOutput);
  const cleanExpected = normalizeOutput(expectedOutput);

  return {
    isMatched: cleanActual === cleanExpected,
    cleanActual,
    cleanExpected,
  };
};

const validateOutputFile = (outputFilePath, expectedOutput) => {
  let actualOutput = "";

  if (outputFilePath && fs.existsSync(outputFilePath)) {
    actualOutput = fs.readFileSync(outputFilePath, "utf8");
  }

  return validateOutput(actualOutput, expectedOutput);
};

module.exports = { validateOutput, validateOutputFile, normalizeOutput };
