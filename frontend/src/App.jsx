import { useState } from "react";

function App() {
  const [draft, setDraft] = useState("");

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
      <button>Review</button>
    </div>
  );
}

export default App;