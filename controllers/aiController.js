// const { GoogleGenerativeAI } = require("@google/generative-ai");

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// exports.explainProblem = async (req, res) => {
//   try {
//     const { title, description } = req.body;
//     if (!title || !description) {
//       return res.status(400).json({ success: false, message: "Title and description are required." });
//     }
//     const prompt = `Explain the following problem in a simplified way, provide a real-world intuition, and identify core edge cases:
// Title: ${title}
// Description: ${description}`;
//     const result = await model.generateContent(prompt);
//     return res.status(200).json({ success: true, explanation: result.response.text() });
//   } catch (error) {
//     console.error("AI Explain Error:", error.message);
//     return res.status(500).json({ success: false, message: "AI generation failed." });
//   }
// };

// exports.analyzeComplexity = async (req, res) => {
//   try {
//     const { code, language } = req.body;
//     if (!code || !language) {
//       return res.status(400).json({ success: false, message: "Code and language are required." });
//     }
//     const prompt = `Analyze the time and space complexity of this ${language} code. Estimate the Time Complexity (e.g. O(N)) and Space Complexity (e.g. O(1)) and provide optimization suggestions:
// Code:
// ${code}`;
//     const result = await model.generateContent(prompt);
//     return res.status(200).json({ success: true, analysis: result.response.text() });
//   } catch (error) {
//     console.error("AI Complexity Error:", error.message);
//     return res.status(500).json({ success: false, message: "AI generation failed." });
//   }
// };

// exports.generateHint = async (req, res) => {
//   try {
//     const { problemDescription, userCode, errorMessage } = req.body;
//     if (!problemDescription) {
//       return res.status(400).json({ success: false, message: "Problem description is required." });
//     }
//     const prompt = `You are a Socratic programming tutor. Provide short, progressive hints for the user's current solution to guide them towards the correct answer. You must NOT provide the direct code solution.
// Problem Description: ${problemDescription}
// User's Code: ${userCode || "No code provided"}
// Error Message: ${errorMessage || "No error message provided"}`;
//     const result = await model.generateContent(prompt);
//     return res.status(200).json({ success: true, hint: result.response.text() });
//   } catch (error) {
//     console.error("AI Hint Error:", error.message);
//     return res.status(500).json({ success: false, message: "AI generation failed." });
//   }
// };

// exports.generateTestcases = async (req, res) => {
//   try {
//     const { title, description, solutionCode, count = 3 } = req.body;
//     if (!title || !description || !solutionCode) {
//       return res.status(400).json({ success: false, message: "Title, description, and solutionCode are required." });
//     }
//     const prompt = `Generate exactly ${count} test cases (including edge and boundary cases) for the problem:
// Title: ${title}
// Description: ${description}
// Reference Solution Code: ${solutionCode}

// You must return a JSON array of objects. Each object must have these exact fields:
// - "input": string containing input
// - "expectedOutput": string containing expected output
// - "isHidden": boolean
// - "explanation": string explaining the test case

// Do not wrap the JSON output in markdown blocks or any other text. Return ONLY raw JSON.`;
//     const result = await model.generateContent({
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//       generationConfig: { responseMimeType: "application/json" }
//     });
//     const testcases = JSON.parse(result.response.text());
//     return res.status(200).json({ success: true, testcases });
//   } catch (error) {
//     console.error("AI Testcase Generation Error:", error.message);
//     return res.status(500).json({ success: false, message: "AI generation failed." });
//   }
// };

// exports.dryRunCode = async (req, res) => {
//   try {
//     const { code, input, language } = req.body;
//     if (!code || !language) {
//       return res.status(400).json({ success: false, message: "Code and language are required." });
//     }
//     const prompt = `Perform a dry run of the following ${language} code on the provided input:
// Input: ${input || "None"}
// Code:
// ${code}

// Provide a step-by-step variable state trace and loop execution breakdown formatted in clean Markdown.`;
//     const result = await model.generateContent(prompt);
//     return res.status(200).json({ success: true, dryRun: result.response.text() });
//   } catch (error) {
//     console.error("AI Dry Run Error:", error.message);
//     return res.status(500).json({ success: false, message: "AI generation failed." });
//   }
// };

// exports.aiCoder = async (req, res) => {
//   try {
//     const { problemDescription, userCode, language, requestType } = req.body;
//     if (!problemDescription || !language) {
//       return res.status(400).json({ success: false, message: "Problem description and language are required." });
//     }
//     const prompt = `Provide coding assistance for the following problem.
// Problem: ${problemDescription}
// User's current code (if any): ${userCode || ""}
// Programming Language: ${language}
// Request Type: ${requestType || "reference code"}

// Provide clean reference code or refactoring assistance as requested, without unnecessary explanation.`;
//     const result = await model.generateContent(prompt);
//     return res.status(200).json({ success: true, code: result.response.text() });
//   } catch (error) {
//     console.error("AI Coder Error:", error.message);
//     return res.status(500).json({ success: false, message: "AI generation failed." });
//   }
// };


const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  modelName: "gemini-1.5-flash",
  temperature: 0.2,
});

exports.explainProblem = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required." });
    }

    const prompt = ChatPromptTemplate.fromTemplate(`
Explain the following problem in a simplified way, provide a real-world intuition, and identify core edge cases:
Title: {title}
Description: {description}
    `);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({ title, description });

    return res.status(200).json({ success: true, explanation: response.content });
  } catch (error) {
    console.error("AI Explain Error:", error.message);
    return res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

exports.analyzeComplexity = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ success: false, message: "Code and language are required." });
    }

    const prompt = ChatPromptTemplate.fromTemplate(`
Analyze the time and space complexity of this {language} code. Estimate the Time Complexity (e.g. O(N)) and Space Complexity (e.g. O(1)) and provide optimization suggestions:
Code:
{code}
    `);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({ language, code });

    return res.status(200).json({ success: true, analysis: response.content });
  } catch (error) {
    console.error("AI Complexity Error:", error.message);
    return res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

exports.generateHint = async (req, res) => {
  try {
    const { problemDescription, userCode, errorMessage } = req.body;
    if (!problemDescription) {
      return res.status(400).json({ success: false, message: "Problem description is required." });
    }

    const prompt = ChatPromptTemplate.fromTemplate(`
You are a Socratic programming tutor. Provide short, progressive hints for the user's current solution to guide them towards the correct answer. You must NOT provide the direct code solution.
Problem Description: {problemDescription}
User's Code: {userCode}
Error Message: {errorMessage}
    `);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      problemDescription,
      userCode: userCode || "No code provided",
      errorMessage: errorMessage || "No error message provided",
    });

    return res.status(200).json({ success: true, hint: response.content });
  } catch (error) {
    console.error("AI Hint Error:", error.message);
    return res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

exports.generateTestcases = async (req, res) => {
  try {
    const { title, description, solutionCode, count = 3 } = req.body;
    if (!title || !description || !solutionCode) {
      return res.status(400).json({ success: false, message: "Title, description, and solutionCode are required." });
    }

    const jsonModel = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      modelName: "gemini-1.5-flash",
      temperature: 0.1,
      responseMimeType: "application/json",
    });

    const prompt = ChatPromptTemplate.fromTemplate(`
Generate exactly {count} test cases (including edge and boundary cases) for the problem:
Title: {title}
Description: {description}
Reference Solution Code: {solutionCode}

You must return a JSON array of objects. Each object must have these exact fields:
- "input": string containing input
- "expectedOutput": string containing expected output
- "isHidden": boolean
- "explanation": string explaining the test case

Return ONLY raw JSON array.
    `);

    const chain = prompt.pipe(jsonModel);
    const response = await chain.invoke({ title, description, solutionCode, count });
    const testcases = JSON.parse(response.content);

    return res.status(200).json({ success: true, testcases });
  } catch (error) {
    console.error("AI Testcase Generation Error:", error.message);
    return res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

exports.dryRunCode = async (req, res) => {
  try {
    const { code, input, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ success: false, message: "Code and language are required." });
    }

    const prompt = ChatPromptTemplate.fromTemplate(`
Perform a dry run of the following {language} code on the provided input:
Input: {input}
Code:
{code}

Provide a step-by-step variable state trace and loop execution breakdown formatted in clean Markdown.
    `);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      language,
      input: input || "None",
      code,
    });

    return res.status(200).json({ success: true, dryRun: response.content });
  } catch (error) {
    console.error("AI Dry Run Error:", error.message);
    return res.status(500).json({ success: false, message: "AI generation failed." });
  }
};

exports.aiCoder = async (req, res) => {
  try {
    const { problemDescription, userCode, language, requestType } = req.body;
    if (!problemDescription || !language) {
      return res.status(400).json({ success: false, message: "Problem description and language are required." });
    }

    const prompt = ChatPromptTemplate.fromTemplate(`
Provide coding assistance for the following problem.
Problem: {problemDescription}
User's current code (if any): {userCode}
Programming Language: {language}
Request Type: {requestType}

Provide clean reference code or refactoring assistance as requested, without unnecessary explanation.
    `);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      problemDescription,
      userCode: userCode || "None",
      language,
      requestType: requestType || "reference code",
    });

    return res.status(200).json({ success: true, code: response.content });
  } catch (error) {
    console.error("AI Coder Error:", error.message);
    return res.status(500).json({ success: false, message: "AI generation failed." });
  }
};