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
    </div>
  );
}
export default App;