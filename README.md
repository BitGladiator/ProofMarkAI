# ProofMark AI — Brand Governance Review API

ProofMark AI is a FastAPI-based AI review service that checks draft marketing content against supplied brand guidelines and approved facts before publication. It returns structured findings to help reviewers identify potential tone, terminology, and unsupported-claim issues.

## Tech stack

- Python and FastAPI
- Google Gemini (`gemini-3.1-flash-lite`)
- Pydantic for structured response validation
- Pytest for automated testing (if configured in `tests/`)

## Project structure

```text
ProofMarkAI/
├── results/             # Local review/test outputs
├── routes/              # FastAPI route handlers
├── schema/              # Pydantic request/response models
├── service/             # Prompt, Gemini, review, and evidence logic
├── test_cases/          # Sample review inputs
├── tests/               # Automated tests
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env                 # Local secrets (never commit)
├── .gitignore
└── README.md
```

Python cache folders such as `__pycache__/` should not be committed.

## Local setup

1. Clone the repository and open its root folder.
2. Create and activate a virtual environment:

   **Windows (PowerShell):**
   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   **macOS/Linux:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the project root:
   ```env
   GENAI_API_KEY=your_gemini_api_key
   GENAI_MODEL=gemini-3.1-flash-lite
   ```
5. Start the API:
   ```bash
   uvicorn main:app --reload
   ```
6. Open the interactive API documentation at `http://127.0.0.1:8000/docs`.

## Example review request

Use the review endpoint shown in `/docs` (for example, `POST /review` if that is the route configured in your app). Example JSON body:

```json
{
  "draft_content": "Our AI Support Bot guarantees 100% accurate answers. Buy it NOW!!!",
  "brand_guidelines": [
    {"id": "BG001", "rule": "Maintain a professional and informative tone."},
    {"id": "BG002", "rule": "Always use the product name 'AI Customer Assistant'."}
  ],
  "approved_facts": [
    {"id": "FACT001", "fact": "The AI Customer Assistant helps businesses respond to customer queries."}
  ]
}
```

The service uses Gemini to produce a structured review validated against the project's Pydantic response schema. A compliant draft may correctly return **zero findings**. Exact response fields depend on `schema/review_schema.py`.

## Evidence references

Brand guidelines and approved facts carry IDs supplied with the request. Review findings should reference only IDs provided in the current review context. Validate returned IDs in the review/evidence service rather than assuming model-generated references are correct. An unsupported claim is not necessarily proven false by the absence of an approved fact.

## Testing

If the `tests/` directory contains Pytest tests, run:

```bash
python -m pytest tests -v
```

Use examples from `test_cases/` to verify both compliant and non-compliant content. Store local output artifacts in `results/` as needed.

## Frontend integration

The MERN frontend sends the draft, guidelines, and facts to the deployed FastAPI endpoint. The FastAPI backend calls Gemini and returns the review JSON. **The frontend must never receive or store `GENAI_API_KEY`.**

When the frontend and backend run on different origins, configure FastAPI CORS to allow the frontend's actual domain.

## Deployment

Deploy the FastAPI app to a Python-compatible hosting provider. A typical start command is:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Configure `GENAI_API_KEY` and `GENAI_MODEL` as server-side environment variables. The host's port/start-command syntax may vary. Consider authentication and rate limiting before exposing the API publicly to protect quota.

## Security

- Keep `.env`, `.venv/`, and `__pycache__/` out of Git.
- Never commit or expose API keys in client-side code.
- Rotate any API key that has accidentally been committed.
- Avoid logging sensitive draft content or API credentials.

## Contributing

Create a feature branch, commit your changes, push the branch, and open a pull request against the team's main branch.
