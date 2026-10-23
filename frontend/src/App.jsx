import { useState } from "react";
function App() {
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const [findings, setFindings] = useState([]);
  function handleClick() {
    if (draft === "") {
      setMessage("Please type something first");
      setFindings([]);
    } else {
      setMessage("");
      setFindings([
        {
          type: "Grammar",
          original: "This is a sample draft",
          suggestion: "This is a sample draft.",
        },
        {
          type: "Clarity",
          original: "to test the review button",
          suggestion: "to test the Review button",
        },
        {
          type: "Tone",
          original: "sample",
          suggestion: "example",
        },
      ]);
    }
  }
  function handleSample() {
    setDraft("This is a sample draft to test the review button.");
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
      <button onClick={handleClick}>Review</button>
      <button onClick={handleSample}>Load sample</button>
      <p>{message}</p>
      {findings.map((f, i) => (
      <div key={i} style={{ border: "1px solid gray", margin: "8px", padding: "8px" }}>
          <strong>{f.type}</strong>
          <p>Original: {f.original}</p>
          <p>Suggestion: {f.suggestion}</p>
      </div>
      ))}
    </div>
  );
}
export default App;