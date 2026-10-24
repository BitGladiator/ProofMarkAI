import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
function App() {
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const severityColors = {
    High: "red",
    Medium: "orange",
    Low: "green",
  };
  async function handleClick() {
    if (draft.trim() === "") {
      setMessage("Please type something first");
      setFindings([]);
      return;
    }

    setLoading(true);
    setMessage("");
    setFindings([]);

    try {
      const response = await fetch(API_URL + "/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draft }),
      });
      const data = await response.json();
      setFindings(data.findings);
      if (data.findings.length === 0) {
        setMessage("No issues found");
      }
    } catch (error) {
      setMessage("Could not reach the review service. Please try again.");
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
    setDraft(draft.replace(f.excerpt, f.suggestion));
    setFindings(findings.filter((item, i) => i !== index));
  }
  function handleDismiss(index) {
    setFindings(findings.filter((item, i) => i !== index));
  }
  return (
    <div>
      <h1>ProofMark AI</h1>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={8}
        placeholder="Paste your draft here"
      />
      <br />
      <button onClick={handleClick} disabled={loading}>
        {loading ? "Reviewing..." : "Review"}
      </button>
      <button onClick={handleSample}>Load sample</button>
      <button onClick={handleReviewAgain} disabled={loading || findings.length === 0}>
        Review again
      </button>
      <p>{message}</p>
      {findings.map((f, i) => (
        <div key={i} style={{ border: "1px solid gray", margin: "8px", padding: "8px" }}>
          <strong>{f.category}</strong>
          <span style={{ color: severityColors[f.severity], marginLeft: "8px" }}>
            {f.severity}
          </span>
          <p>Excerpt: {f.excerpt}</p>
          <p>Why: {f.explanation}</p>
          <p>Source: {f.evidence}</p>
          <p>Suggested rewrite: {f.suggestion}</p>
          <button onClick={() => handleAccept(i)}>Accept suggestion</button>
          <button onClick={() => handleDismiss(i)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}
export default App;