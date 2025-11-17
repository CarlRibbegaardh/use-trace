import { useState, useEffect } from "react";
import "./App.css";

/**
 * Timer component for Remote 2
 */
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, setSeconds]);

  return (
    <div className="timer">
      <div className="timer-display">{seconds}s</div>
      <div className="timer-controls">
        <button onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={() => setSeconds(0)}>Reset</button>
      </div>
    </div>
  );
}

/**
 * Form component for Remote 2
 */
function Form() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="form-container">
      <h4>User Form</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div className="form-field">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <button type="submit">Submit</button>
        {submitted && <div className="success-message">✓ Submitted!</div>}
      </form>
    </div>
  );
}

/**
 * Remote 2 App - Exposed to host via Module Federation
 */
function App() {
  const [showTimer, setShowTimer] = useState(true);
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="remote-app remote2">
      <div className="remote-header">
        <h2>🟩 Remote 2 Application</h2>
        <p>Timer and Form Components</p>
      </div>

      <div className="toggle-buttons">
        <button onClick={() => setShowTimer(!showTimer)}>
          {showTimer ? "Hide" : "Show"} Timer
        </button>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Hide" : "Show"} Form
        </button>
      </div>

      <div className="components-grid">
        {showTimer && <Timer />}
        {showForm && <Form />}
      </div>
    </div>
  );
}

export default App;
