# ProofMark AI

> **Brand-Governance Assistant**  
> Reviews draft marketing and communication content against supplied brand guidelines, approved terminology, and approved facts. Built with Node.js/Express backend and React/TypeScript/Vite frontend.

---

## 1. Project Overview

ProofMark AI is an automated brand-governance assistant built for marketing and communication teams. It validates drafts against:
1. **Deterministic Terminology Rules**: High-speed, word-boundary-aware matching for preferred/avoided vocabulary without LLM hallucination.
2. **AI-Powered Tone & Voice Review**: Identifies hyperbole, aggressive tone, or voice deviations against brand guidelines.
3. **Claim & Factual Consistency Review**: Cross-references assertions against approved facts.
4. **Human-in-the-Loop Governance**: The AI **never automatically approves content** and marks `needs_human_review: true`. Claims that cannot be verified using approved facts are flagged for human verification rather than declared false.

---

## 2. Architecture & Project Structure

```
ProofMarkAI/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.js         # Environment config & origin parsing
│   │   │   └── logging.js        # Structured logging with secret redaction
│   │   ├── data/                 # Sample reference JSON datasets
│   │   │   ├── approved_facts.json
│   │   │   ├── approved_terms.json
│   │   │   └── brand_guidelines.json
│   │   ├── routes/
│   │   │   ├── health.js         # GET /api/health
│   │   │   ├── index.js          # Route aggregator
│   │   │   └── review.js         # POST /api/review
│   │   ├── rules/
│   │   │   └── terminology.js    # Deterministic terminology engine
│   │   ├── schemas/
│   │   │   └── review.js         # Strict Zod schemas for requests & responses
│   │   ├── services/
│   │   │   ├── ai_review_service.js  # AI LLM provider interface
│   │   │   ├── finding_merger.js     # Deduplication & canonical ID assignment
│   │   │   ├── reference_service.js  # Reference resolver & ID validator
│   │   │   └── review_service.js     # Review orchestrator
│   │   ├── utils/
│   │   │   └── errors.js         # AppError classes & HTTP error mappings
│   │   ├── index.js              # Application entry re-export
│   │   └── main.js               # Express app initialization & server entry
│   └── tests/
│       ├── test_ai_failures.test.js  # Upstream AI timeouts, outages, & CORS
│       ├── test_health.test.js       # Health endpoint & Swagger UI tests
│       ├── test_helpers.js           # In-memory test dispatcher
│       ├── test_review.test.js       # Validation, defaults & 5 draft examples
│       └── test_terminology.test.js  # Word boundaries & casing adaptation
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts         # Reusable API client (fetch, timeouts, error mapping)
│   │   ├── components/
│   │   │   ├── DraftEditor.tsx   # Textarea, char count, sample loader, clear action
│   │   │   ├── FindingsList.tsx  # Finding cards, category filtering, accept/dismiss actions
│   │   │   ├── Header.tsx        # Wordmark & live backend connection badge
│   │   │   └── ReferenceSettings.tsx # Collapsible brand standards editor
│   │   ├── data/
│   │   │   ├── samples.json      # Sample draft & reference datasets
│   │   │   └── samples.ts        # Typed sample exports
│   │   ├── tests/
│   │   │   ├── actions.test.js   # Suggestion replacement & dismissal logic tests
│   │   │   └── samples.test.js   # Schema & sample draft integrity tests
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces for API contract
│   │   ├── App.tsx               # Main UI orchestrator
│   │   ├── index.css             # Polished, professional system styles
│   │   └── main.tsx              # React DOM entry point
│   ├── .env.example              # Frontend environment template
│   ├── package.json              # Frontend dependencies (React, Vite, TS)
│   ├── tsconfig.json             # TypeScript compiler config
│   └── vite.config.ts            # Vite configuration (port 5173)
├── .env.example                  # Backend environment template
├── package.json                  # Root runner scripts
└── README.md
```

---

## 3. Technology Stack

- **Backend**: Node.js (v20+), Express 5, Zod (v4), dotenv, CORS
- **Frontend**: React 18, TypeScript, Vite 5, Plain CSS
- **Testing**: Node.js built-in test runner (`node --test`), Supertest
- **Documentation**: Swagger UI at `http://127.0.0.1:8000/docs`

---

## 4. Quick Start & Setup

### A. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### B. Configure Environment Variables

1. **Backend** (in project root):
   ```bash
   cp .env.example .env
   ```
   *Defaults work out of the box (`PORT=8000`, `FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000`). If `AI_PROVIDER` / `AI_API_KEY` is not provided, the backend safely completes deterministic terminology checks and reports that AI checks were skipped.*

2. **Frontend** (in `frontend/` directory):
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   *Default: `VITE_API_BASE_URL=http://127.0.0.1:8000`.*

---

## 5. Running the Application

### Option 1: Run Services in Two Terminals (Recommended for Development)

**Terminal 1 — Backend**:
```bash
npm run dev:backend
# Or: npm start
```
*Backend runs on `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).*

**Terminal 2 — Frontend**:
```bash
npm run dev:frontend
```
*Frontend runs on `http://localhost:5173`.*

Open your browser to `http://localhost:5173` to test the integrated prototype.

---

## 6. Running Automated Tests

Run the complete test suite across backend and frontend:

```bash
npm run test:all
```

Or run suites individually:
```bash
# Run backend tests (32 tests: health, terminology, review, failure resilience)
npm run test:backend

# Run frontend tests (7 tests: actions, suggestion replacement, sample integrity)
npm run test:frontend
```

---

## 7. End-to-End User Flow

1. **Header Connection Indicator**: On load, the frontend queries `GET /api/health`. A badge indicates `"Connected"` with a green dot (or `"Disconnected"` with a Retry action if the backend is down).
2. **Draft Editor**:
   - Type or paste draft copy.
   - Click **"Load sample"** to test a realistic marketing draft containing terminology issues (`consumer`, `magic bot`), hyperbole, and exaggerated claims.
   - Click **"Clear"** to reset (with confirmation if text is present).
3. **Brand Standards & Settings**:
   - By default, uses the backend's bundled profile.
   - Toggle to **"Custom reference rules"** to edit guidelines, terminology rules, or approved facts in JSON format with live syntax validation.
4. **Review Content**:
   - Click **"Review content"**. The frontend sends the payload to `POST /api/review`.
   - Results are displayed on the right/bottom panel with severity badges (Low/Medium/High), confidence ratings, explanations, and evidence IDs.
5. **Accept Suggestions**:
   - Click **"Accept suggestion"** on any finding to automatically update the draft text in the editor.
6. **Dismiss Findings**:
   - Click **"Dismiss"** to collapse or dim the finding (or click **"Undo dismiss"** to restore it).
7. **Re-Review**:
   - After accepting suggestions or editing, click **"Review content"** again to run an updated scan.

---

## 8. API Contract Summary

### `GET /api/health`
**Response (`200 OK`)**:
```json
{
  "status": "ok",
  "service": "ProofMark AI Backend"
}
```

### `POST /api/review`
**Request Payload**:
```json
{
  "draft_text": "Our product is the best in the world for every consumer.",
  "brand_guidelines": [
    { "id": "VOICE-01", "text": "Use clear, friendly, and professional language." }
  ],
  "approved_terms": [
    { "id": "TERM-01", "preferred": "customer", "avoid": ["consumer"] }
  ],
  "approved_facts": [
    { "id": "FACT-01", "text": "The service is available in 10 regions." }
  ]
}
```

**Response Payload (`200 OK`)**:
```json
{
  "findings": [
    {
      "id": "F-001",
      "category": "Terminology",
      "severity": "Low",
      "excerpt": "consumer",
      "explanation": "The supplied terminology rules prefer 'customer' over 'consumer'.",
      "suggestion": "customer",
      "evidence_ids": ["TERM-01"],
      "confidence": "high"
    }
  ],
  "review_summary": "Review completed with 1 potential issue.",
  "needs_human_review": true,
  "review_status": {
    "terminology_check": "completed",
    "ai_review_check": "skipped",
    "details": "AI review skipped: AI_PROVIDER / AI_API_KEY is not configured in environment."
  }
}
```

---

## 9. Limitations & Integration Status


All errors return a uniform format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "draft_text must contain non-whitespace text",
    "details": [
      {
        "field": "draft_text",
        "message": "draft_text must contain non-whitespace text"
      }
    ]
  }
}
```

**Common HTTP Status Codes**:
- `200`: Review completed.
- `422`: Validation failure (empty draft, oversized draft, duplicate reference IDs, malformed JSON).
- `403`: Forbidden CORS origin.
- `429`: Upstream AI rate limit exceeded.
- `502 / 503`: Upstream AI provider outage or invalid output.
- `504`: Upstream AI timeout.

---

## 10. AI Module Integration (Anushka's Team Interface)

The AI integration lives in [`backend/app/services/ai_review_service.js`](file:///Users/karansharma/Desktop/Projects/ProofMarkAI/backend/app/services/ai_review_service.js).

### Interface Signature
```js
async function reviewWithAi(draftText, brandGuidelines, approvedFacts, options)
```

### Safety & Guardrails
- **Prompt Injection Defense**: Inputs are wrapped as JSON payload data within a strict system prompt instructing the model to treat draft text as untrusted data.
- **Evidence ID Verification**: Any `evidence_ids` returned by the model are validated against the known guideline and fact IDs. Hallucinated IDs are discarded.
- **Human Verification Policy**: Unverified claims are categorized under `Claims` and flagged for human verification, never auto-declared false.
- **Zero API Key Requirement for Local Dev**: If `AI_PROVIDER` is unset, the system completes deterministic checks and reports `ai_review_check: "skipped"` in `review_status`.

---

## 11. Frontend Integration Guide (Deepali / Suthakani)

Frontend apps can call `/api/review` via `fetch` or Axios:
```javascript
const response = await fetch('http://localhost:8000/api/review', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    draft_text: userDraftText
    // brand_guidelines, approved_terms, approved_facts optional
  })
});

const data = await response.json();
if (!response.ok) {
  console.error(data.error.message);
} else {
  // Render findings and review summary
  console.log(data.findings);
}
```
