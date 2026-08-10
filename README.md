# Code-Toon Backend

Welcome to the backend repository for Code-Toon a multi-language online judge engine integrated with a 6-agent AI tutoring pipeline. 

This project was built to address two core requirements:
1. Executing user submissions asynchronously and safely in isolated environments without blocking the main event loop.
2. Providing Socratic hints, complexity breakdowns, and step-by-step dry runs when users encounter bugs, rather than relying solely on raw error logs.

---

## Tech Stack

* Node.js & Express: Core REST API layer.
* MongoDB & Mongoose: Manages users, problem sets, test cases, and execution history.
* Redis & BullMQ: Asynchronous task queuing system to manage execution workloads off the main thread.
* LangChain & Google Gemini 1.5 Flash: Powers the 6 AI agents for hinting, complexity analysis, dry runs, and test case generation.
* Google OAuth 2.0 & JWT: Handles authentication and role-based access control.

---

## Architecture & System Design

### 1. Code Compiler & Sandbox Engine
When a user submits code:
* The submission is pushed into a BullMQ Queue backed by Redis.
* A background worker picks up the job and writes the source code and input into temporary files inside a local workspace.
* It executes the code inside a native OS subprocess using physical file I/O redirection (command < input.txt > output.txt).
* Execution time is tracked down to the millisecond using Node's process.hrtime() to handle Time Limit Exceeded (TLE) conditions.
* Output is normalized (removing trailing whitespace and unifying line endings) and compared against expected results.
* Temporary workspace files are unlinked asynchronously post-execution.

Supported languages include C++, Java, Python, JavaScript, and Go.

### 2. Multi-Queue Worker Setup
To manage workload distribution, task execution is separated into 3 priority queues:
* High-Priority Queue: Handles quick sample test executions on the problem interface.
* Standard Queue: Processes full submissions against complete hidden test suites.
* Batch Queue: Manages administrative re-judging tasks.

### 3. The 6 AI Agents (/api/v1/ai)
The AI capabilities are divided across 6 dedicated endpoints using LangChain and Gemini 1.5 Flash:

1. Problem Explainer: Simplifies complex problem descriptions into core intuition and edge cases.
2. Complexity Auditor: Provides O(N) time and space complexity breakdowns with optimization tips.
3. Socratic Hint Generator: Analyzes failing code and error messages to provide progressive hints without revealing direct code solutions.
4. Test Case Generator: Administrative tool using structured JSON response configurations to return valid test case objects.
5. Dry Runner: Generates step-by-step line execution traces and variable state changes formatted in Markdown.
6. AI Coder: Delivers reference implementations and code refactoring assistance.

---

## API Endpoints Reference

### Auth & User Management (/api/v1/auth, /api/v1/users)
* GET /api/v1/auth/google — Initiates Google OAuth authentication.
* GET /api/v1/auth/me — Retrieves authenticated user profile.
* GET /api/v1/users/leaderboard — Returns user rankings based on total problems solved.

### Problem Management (/api/v1/problems)
* GET /api/v1/problems — Retrieves problem list with search, difficulty filtering, and pagination.
* GET /api/v1/problems/:id — Retrieves single problem details (filters out hidden test cases for non-admins).
* POST /api/v1/problems — Admin endpoint to create a problem.
* POST /api/v1/problems/:id/testcases — Admin endpoint to add a test case.
* PUT /api/v1/problems/:id/testcases/:testcaseId — Admin endpoint to update a test case.
* DELETE /api/v1/problems/:id/testcases/:testcaseId — Admin endpoint to delete a test case.

### Submissions (/api/v1/submissions)
* POST /api/v1/submissions/submit — Enqueues code submission for evaluation.
* GET /api/v1/submissions/user — Retrieves submission history for the logged-in user.
* GET /api/v1/submissions/:submissionId — Retrieves detailed execution report for a submission.

---

## Local Setup

### Prerequisites
* Node.js (v18+)
* MongoDB
* Redis Server
* System compilers for target languages (g++, python3, javac, node, go).

### Installation

1. Clone the repository and install dependencies:
```bash
git clone [https://github.com/DeepanshuSolanki09/Codetoon.git](https://github.com/DeepanshuSolanki09/Codetoon.git)
cd Codetoon
npm install
