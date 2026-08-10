const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { runInSandbox } = require("./sandbox");

const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const pythonCmd = process.platform === "win32" ? "python" : "python3";

const cleanupFiles = (files) => {
  files.forEach((file) => {
    if (file && fs.existsSync(file)) {
      fs.unlink(file, () => {});
    }
  });
};

const compileAndRun = async (language, code, input = "", timeLimit = 2000) => {
  const jobId = uuidv4();
  const lang = language.toLowerCase();
  const filesToCleanup = [];

  const inputFilePath = path.join(tempDir, `${jobId}_in.txt`);
  const outputFilePath = path.join(tempDir, `${jobId}_out.txt`);

  fs.writeFileSync(inputFilePath, input || "");
  filesToCleanup.push(inputFilePath, outputFilePath);

  let command = "";

  if (lang === "cpp") {
    const sourceFilePath = path.join(tempDir, `${jobId}.cpp`);
    const binaryPath = path.join(tempDir, jobId);
    fs.writeFileSync(sourceFilePath, code);
    filesToCleanup.push(sourceFilePath);

    if (process.platform === "win32") {
      filesToCleanup.push(`${binaryPath}.exe`);
      command = `g++ "${sourceFilePath}" -o "${binaryPath}" && "${binaryPath}.exe"`;
    } else {
      filesToCleanup.push(binaryPath);
      command = `g++ "${sourceFilePath}" -o "${binaryPath}" && "${binaryPath}"`;
    }
  } else if (lang === "python") {
    const sourceFilePath = path.join(tempDir, `${jobId}.py`);
    fs.writeFileSync(sourceFilePath, code);
    filesToCleanup.push(sourceFilePath);
    command = `${pythonCmd} "${sourceFilePath}"`;
  } else if (lang === "javascript") {
    const sourceFilePath = path.join(tempDir, `${jobId}.js`);
    fs.writeFileSync(sourceFilePath, code);
    filesToCleanup.push(sourceFilePath);
    command = `node "${sourceFilePath}"`;
  } else if (lang === "java") {
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : "Main";
    const sourceFilePath = path.join(tempDir, `${className}.java`);
    fs.writeFileSync(sourceFilePath, code);
    filesToCleanup.push(
      sourceFilePath,
      path.join(tempDir, `${className}.class`)
    );
    command = `javac "${sourceFilePath}" && java -cp "${tempDir}" ${className}`;
  } else if (lang === "go") {
    const sourceFilePath = path.join(tempDir, `${jobId}.go`);
    fs.writeFileSync(sourceFilePath, code);
    filesToCleanup.push(sourceFilePath);
    command = `go run "${sourceFilePath}"`;
  } else {
    cleanupFiles(filesToCleanup);
    throw {
      status: "Compilation Error",
      errorMessage: `Unsupported language: ${language}`,
    };
  }

  try {
    const { executionTime } = await runInSandbox(
      command,
      inputFilePath,
      outputFilePath,
      timeLimit
    );

    return {
      outputFilePath,
      executionTime,
      filesToCleanup,
    };
  } catch (err) {
    cleanupFiles(filesToCleanup);
    throw err;
  }
};

module.exports = { compileAndRun, cleanupFiles };
