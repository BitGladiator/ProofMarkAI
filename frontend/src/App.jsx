import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
function App() {
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guideline, setGuideline] = useState("General");
  const [error, setError] = useState("");
  const severityColors = {
    High: "text-red-400",
    Medium: "text-amber-400",
    Low: "text-green-400",
  };
  async function handleClick() {
    if (draft.trim() === "") {
      setError("Please type something first");
      setMessage("");
      setFindings([]);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setFindings([]);
    try {
      const response = await fetch(API_URL + "/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draft, guideline: guideline }),
      });
      if (!response.ok) {
        throw new Error("Server error");
      }
      const data = await response.json();
      const list = data.findings || [];
      setFindings(list);
      if (list.length === 0) {
        setMessage("No issues were flagged in this check. Please still review your draft yourself.");
      }
    } catch (err) {
      setError("Could not get a review right now. Please check the backend is running and try again.");
    }
    setLoading(false);
  }
  function handleSample() {
    setDraft("This is a sample draft to test the review button.");
  }
  function handleReviewAgain() {
    handleClick();
  }
  function handleAccept(index) {
    const f = findings[index];
    if (!draft.includes(f.excerpt)) {
      setError("That text is no longer in your draft, so the suggestion could not be applied.");
      return;
    }
    setError("");
    setDraft(draft.replace(f.excerpt, f.suggestion));
    setFindings(findings.filter((item, i) => i !== index));
  }
  function handleDismiss(index) {
    setFindings(findings.filter((item, i) => i !== index));
  }
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <main className="mx-auto max-w-2xl p-4">
        <h1 className="mb-4 text-center text-3xl font-bold">ProofMark AI</h1>
        <label htmlFor="guideline" className="mb-1 block text-sm">
          Brand guideline
        </label>
        <select
          id="guideline"
          value={guideline}
          onChange={(e) => setGuideline(e.target.value)}
          className="mb-3 w-full rounded border border-slate-500 bg-slate-800 p-2"
        >
          <option value="General">General</option>
          <option value="Formal">Formal</option>
          <option value="Friendly">Friendly</option>
        </select>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          aria-label="Draft content"
          maxLength={5000}
          placeholder="Paste your draft here"
          className="w-full rounded border border-slate-500 bg-slate-800 p-2"
        />
        <p className="mt-1 text-right text-sm text-slate-400">{draft.length} / 5000</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleClick}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
          >
            {loading ? "Reviewing..." : "Review"}
          </button>
          <button
            onClick={handleSample}
            className="rounded bg-slate-700 px-4 py-2 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Load sample
          </button>
          <button
            onClick={handleReviewAgain}
            disabled={loading || draft.trim() === ""}
            className="rounded bg-slate-700 px-4 py-2 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
          >
            Review again
          </button>
        </div>
               {loading && (
          <p className="mt-4 flex items-center justify-center gap-2" aria-live="polite">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Reviewing your draft, please wait...
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded border border-red-400 p-3 text-center text-red-300">
            {error}
          </p>
        )}
        <p role="status" className="mt-4 text-center">
          {message}
          {findings.length > 0 && findings.length + " finding(s) to review"}
        </p>
        {!message && !error && !loading && findings.length === 0 && (
          <p className="mt-4 text-center text-slate-300">
            Paste a draft and click Review to see findings.
          </p>
        )}
        {findings.map((f, i) => (
          <section key={i} className="mt-4 rounded border border-slate-500 p-4">
            <h2 className="font-bold">
              {f.category}{" "}
              <span className={severityColors[f.severity]}>{f.severity}</span>
            </h2>
            <p className="mt-2">
              Excerpt: <mark>{f.excerpt}</mark>
            </p>
            <p>Why: {f.explanation}</p>
            <p>Source: {f.evidence}</p>
            <p>Suggested rewrite: {f.suggestion}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleAccept(i)}
                className="rounded bg-blue-600 px-3 py-1 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Accept suggestion
              </button>
              <button
                onClick={() => handleDismiss(i)}
                className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Dismiss
              </button>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
export default App;