import { useState } from "react";
function App() {
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  function handleClick() {
    if (draft === "") {
      setMessage("Please type something first");
    } else {
      setMessage("Reviewing...");
    }
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
      <p>{message}</p>
    </div>
  );
}
export default App;