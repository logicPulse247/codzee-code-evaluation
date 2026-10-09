# AI Interview Prep Kit — Full-Stack Web Application & Evaluation CLI

An end-to-end, production-quality AI application that generates personalized, company-researched interview preparation kits from Job Descriptions (JDs) and company websites. 

Includes an interactive Next.js web application with real-time pipeline progress streaming, an Express backend with MongoDB and JWT authentication, active-recall flashcard practice with weak spot analytics, and a CLI engine for batch evaluation.

---

## 🌟 Key Features

1. **Multi-Stage Research & Generation Pipeline**:
   - **Stage 1 (Requirements Extraction)**: Parses JDs into structured technical, behavioural, and domain requirements with `must` vs `nice` priorities.
   - **Stage 2 & 3 (Web Crawler & Public Research)**: Complies with `robots.txt`, implements SSRF protection, extracts key website content using Cheerio, and wraps crawled text in `<untrusted_web_content>` tags to prevent prompt injection.
   - **Stage 4, 5 & 6 (Deterministic Coverage Engine)**: Generates initial questions, runs pure JS requirement coverage checks, and executes second-pass generation until **100% of must-have requirements** are satisfied.
   - **Stage 7 (Deterministic Schedule Allocator)**: Dynamically distributes study time into exact integer minutes across 1 to 60 days, prioritizing mandatory and higher-difficulty topics earlier.
   - **Stage 8 (Active-Recall Flashcards)**: Creates requirement-mapped flashcards for interactive practice.

2. **Interactive Builder & Edit Preservation**:
   - Live state tracking (`generated`, `edited`, `pinned`).
   - Regenerating single categories or sections **preserves user edits** and pinned items.
   - Reorder questions, edit prompts/answer outlines, and change categories seamlessly.

3. **Active-Recall Practice & Weak Spots Analytics**:
   - 3D flip card practice mode with 3-tier confidence rating (Low, Medium, High).
   - Weak spot report identifies unpracticed/low-confidence cards and highlights mandatory job requirements needing reinforcement.

4. **Shared Pipeline Batch CLI**:
   - Runs `npm run evaluate -- --input <cases.json> --output <kits.json>`.
   - Uses the **exact same unified pipeline code** as the web application.

---

## 🕸️ Web Research & Crawling Methodology

The application implements a robust, respectful, and dynamic web crawling engine designed to research companies and discover hidden hiring processes:

- **Robots.txt Compliance (`robots-parser`)**: All target URLs are checked against the domain's `robots.txt` policy before any fetch is attempted. Disallowed paths are explicitly skipped.
- **Dynamic Content Discovery (`cheerio`)**: Instead of relying on hardcoded paths (`/careers`, `/jobs`), the crawler dynamically extracts, scores, and ranks all links on the company's root page based on high-priority keywords (e.g., *hiring*, *handbook*, *culture*), prioritizing internal domain routing while skipping irrelevant or social media paths.
- **Resilient Fetching & Rate Limiting**: The `fetcher` implements strict domain-level rate limiting (enforcing at least a 250ms delay between requests to the same host) to prevent server overload. It automatically applies exponential backoff on `429` (Too Many Requests) or `5xx` server errors, seamlessly recovering from transient failures.
- **Failure Tolerance**: If a source cannot be retrieved (e.g., 404, network timeout, robots disallow), the crawler explicitly reports the skipped source without failing the entire generation run.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js (App Router), React, Vanilla CSS + Tailwind, Lucide Icons, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT in HTTP-only cookies, Zod validation.
- **AI / LLM**: Gemini (`gemini-2.0-flash`) via `@google/generative-ai` with structured JSON output repair and exponential backoff retry.
- **Testing**: Vitest unit testing engine.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally (`mongodb://localhost:27017/interview_prep_kit`) or MongoDB Atlas URI.
- Google Gemini API Key (`GEMINI_API_KEY`).

### 2. Environment Configuration
Copy `.env.example` to `.env` in root and `backend/`:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Set your configuration variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interview_prep_kit
JWT_SECRET=super-secret-jwt-key-32-chars-long!
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Installation
Install all root, backend, and frontend dependencies:

```bash
npm install
```

### 4. Running Locally
Start both backend (Port 5000) and frontend (Port 3000) concurrently:

```bash
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## 🧪 Running Unit Tests & Batch CLI

### Run Unit Tests
To run backend unit tests (covering deterministic coverage, schedule allocation, and JSON repair):

```bash
npm test
```

### Run Batch Evaluation CLI
Run batch kit generation on test cases defined in `eval_inputs.json`:

```bash
npm run evaluate -- --input eval_inputs.json --output eval_outputs.json
```

---

## 📁 Repository Structure

```
├── backend/
│   ├── src/
│   │   ├── config/             # Environment & DB config
│   │   ├── models/             # User, Kit, Practice Mongoose Schemas
│   │   ├── middleware/         # JWT Auth middleware
│   │   ├── modules/            # Auth, Kits, & Practice routes/controllers/services
│   │   ├── services/
│   │   │   ├── llm/            # Gemini client, JSON repair, & backoff
│   │   │   ├── webResearch/    # Robots parser, SSRF shield, Cheerio scraper
│   │   │   ├── coverage/       # Pure JS deterministic requirement coverage check
│   │   │   ├── schedule/       # Pure JS 1..60 day deterministic schedule allocator
│   │   │   ├── pipeline/       # Stage 1..8 unified generation orchestrator
│   │   │   └── validation/     # Zod schemas for Section 11 compliance
│   │   └── evaluation/         # CLI runner (`evaluate.js`)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router pages (Home, Builder, Practice, Weak Spots)
│   │   ├── components/         # Interactive Builder, Cards, Navbar, SSE Progress Modal
│   │   ├── context/            # AuthContext for session management
│   │   └── lib/                # Axios API instance
│   └── package.json
├── eval_inputs.json            # Sample CLI input cases
└── README.md
```
