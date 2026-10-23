# ProofMark AI — Backend

> **Brand-Governance Assistant Backend**  
> Reviews draft marketing and communication content against supplied brand guidelines, approved terminology, and approved facts. Built with Node.js, Express, and Zod.

---

## 1. Project Overview

ProofMark AI acts as an automated brand-governance assistant. It validates drafts against:
1. **Deterministic Terminology Rules**: High-speed, word-boundary-aware matching for preferred/avoided vocabulary without LLM hallucination.
2. **AI-Powered Tone & Voice Review**: Identifies hyperbole, aggressive tone, or voice deviations against brand guidelines.
3. **Claim & Factual Consistency Review**: Cross-references assertions against approved facts.
4. **Human-in-the-Loop Governance**: The AI **never automatically approves content** and marks `needs_human_review: true`. Claims that cannot be verified using approved facts are flagged for human verification rather than declared false.

---

## 2. Architecture & Request Flow

```
Frontend / Client Request
        │
        ▼ (POST /api/review)
┌─────────────────────────────────────────────────────────────┐
│ Express Application & Middleware                           │
│  - Correlation ID (x-request-id)                            │
│  - CORS origin validation (FRONTEND_ORIGINS)                │
│  - JSON body parsing & length constraints                   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ review_service.js (Orchestrator)                            │
│  1. Zod Request Validation                                  │
│  2. Reference Service (Resolves custom vs. sample fallback) │
│  3. Deterministic Terminology Engine (rules/terminology.js) │
│  4. AI Review Service (services/ai_review_service.js)       │
│  5. Finding Merger & Deduplication (finding_merger.js)      │
│  6. Zod Response Validation                                 │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
     Canonical JSON Response (Findings + Review Status)
```

---

## 3. Folder Structure

```
ProofMarkAI/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.js         # Environment config & origin parsing
│   │   │   └── logging.js        # Safe structured logging (no secret leakage)
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
│   │   │   └── review.js         # Zod schemas for requests & responses
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
│       ├── test_helpers.js          # In-memory test dispatcher
│       ├── test_review.test.js       # Validation, defaults & 5 draft examples
│       └── test_terminology.test.js  # Word boundaries & casing adaptation
├── .env.example
├── package.json
└── README.md
```

---

## 4. Technology Stack & Prerequisites

- **Node.js**: v18.0.0 or newer (v20+ recommended)
- **Framework**: Express 5
- **Schema Validation**: Zod (v4)
- **Environment**: dotenv
- **Test Runner**: Node.js built-in test runner (`node --test`)
- **Interactive Documentation**: Swagger UI at `/docs`

---

## 5. Installation & Setup

1. **Clone or open the repository**:
   ```bash
   cd /path/to/ProofMarkAI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

---

## 6. Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `APP_ENV` | `development` | Application mode (`development` or `production`) |
| `HOST` | `127.0.0.1` | Server binding host |
| `PORT` | `8000` | Port for the HTTP server |
| `FRONTEND_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins (comma-separated or JSON array) |
| `AI_PROVIDER` | `""` | AI provider name (e.g. `openai`, `gemini`, `groq`) |
| `AI_API_KEY` | `""` | Provider API key. When empty, runs deterministic checks without failing |
| `AI_MODEL` | `gpt-4o-mini` | Model identifier |
| `AI_TIMEOUT_SECONDS`| `30` | Network timeout for AI calls |
| `AI_BASE_URL` | `https://api.openai.com/v1` | OpenAI-compatible endpoint URL |
| `MAX_DRAFT_LENGTH` | `20000` | Maximum character length for draft text |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |

---

## 7. Running the Application

### Start Development Server
```bash
npm run dev
```

### Start Production Server
```bash
npm start
```
The server will be available at `http://127.0.0.1:8000`.

### Interactive API Documentation
Open your browser to:
```
http://127.0.0.1:8000/docs
```
This loads an interactive Swagger UI rendered from `/api/openapi.json`.

---

## 8. Running Automated Tests

Run the full suite using the built-in Node.js test runner:
```bash
npm test
```

### Test Coverage Highlights
- **Health**: `/api/health` schema, credential leakage prevention, correlation ID header, `/docs` HTML.
- **Deterministic Terminology**: Avoid terms, case adaptation (`Consumer` $\to$ `Customer`), word boundaries (no false positives for `consumerism`), multi-word phrases, empty inputs.
- **Review Endpoint**: 422 for missing, empty, whitespace-only, oversized drafts; malformed or duplicate reference IDs.
- **5 Representative Draft Examples**:
  1. *Terminology violation*: Flags `consumer` and recommends `customer`.
  2. *Clean draft*: Zero findings and clean summary.
  3. *Tone & hyperbole*: Catches superlatives via mocked AI.
  4. *Unverified claim*: Flags unsupported claims for human verification without fabricating evidence IDs.
  5. *Composite multi-rule*: Merges terminology, tone, and factual claims into canonical `F-001...` sequence.
- **Resilience**: 504 timeouts, 429 rate limits, 502/503 provider outages, malformed LLM responses, and CORS rejections.

---

## 9. API Reference

### A. Health Check
`GET /api/health`

**Response (`200 OK`)**:
```json
{
  "status": "ok",
  "service": "ProofMark AI Backend"
}
```

---

### B. Review Draft
`POST /api/review`

**Headers**:
- `Content-Type: application/json`
- `x-request-id` *(optional correlation ID)*

**Request Body**:
```json
{
  "draft_text": "Our product is the best in the world for every consumer.",
  "brand_guidelines": [
    {
      "id": "VOICE-01",
      "text": "Use clear, friendly, and professional language without unsubstantiated superlatives."
    }
  ],
  "approved_terms": [
    {
      "id": "TERM-01",
      "preferred": "customer",
      "avoid": ["consumer"]
    }
  ],
  "approved_facts": [
    {
      "id": "FACT-01",
      "text": "The service is available in 10 regions."
    }
  ]
}
```

#### Reference Fallback Policy
- **Omitted References**: If `brand_guidelines`, `approved_terms`, or `approved_facts` are omitted from the request, the backend loads the bundled sample datasets from `backend/app/data/`.
- **Explicit Empty List (`[]`)**: If the client sends `[]`, the backend respects it as an empty set and does **not** inject sample data.

**Response (`200 OK`)**:
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

### C. Error Responses

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
