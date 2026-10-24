# ProofMark AI Frontend

React + Vite + Tailwind CSS frontend for reviewing drafts against brand guidelines.

## Run the frontend

```
cd frontend
npm install
npm run dev
```

Open the link shown in the terminal (usually http://localhost:5173).

## Configure the backend URL

Create a file named `.env` inside the `frontend` folder:

```
VITE_API_URL=http://localhost:8000
```

Change the URL to wherever the backend runs, then restart `npm run dev`.
The app calls `POST {VITE_API_URL}/api/review` with `{ "draft_text": "...", "brand_guidelines": [ { "id", "text" } ] }`
and expects `{ "findings": [ { "category", "severity", "excerpt", "explanation", "evidence_ids", "suggestion" } ] }`.

## How to use

1. Pick a brand guideline, paste a draft or click **Load sample**.
2. Click **Review** to see findings.
3. Use **Accept suggestion** to update the draft, **Dismiss** to remove a finding, or **Review again** to re-check the draft.

These are user actions; nothing here is final approval by the AI.