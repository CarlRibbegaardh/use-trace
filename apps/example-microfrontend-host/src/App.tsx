import { Suspense, lazy, useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";
import "./App.css";

// @ts-expect-error - Module federation remote
const Remote1App = lazy(() => import("remote1/App"));
// @ts-expect-error - Module federation remote
const Remote2App = lazy(() => import("remote2/App"));

/**
 * Host application that dynamically loads two remote microfrontends
 */
function App() {
  useAutoTracer();

  const [showRemote1, setShowRemote1] = useState(true);
  const [showRemote2, setShowRemote2] = useState(true);
  const [hostCounter, setHostCounter] = useState(0);

  return (
    <div className="host-container">
      <header className="host-header">
        <h1>Microfrontend Host Application</h1>
        <p>This host loads two remote microfrontends dynamically</p>
      </header>

      <div className="host-controls">
        <h2>Host Controls</h2>
        <div className="button-group">
          <button onClick={() => setHostCounter(c => c + 1)}>
            Host Counter: {hostCounter}
          </button>
          <button onClick={() => setShowRemote1(!showRemote1)}>
            {showRemote1 ? "Hide" : "Show"} Remote 1
          </button>
          <button onClick={() => setShowRemote2(!showRemote2)}>
            {showRemote2 ? "Hide" : "Show"} Remote 2
          </button>
        </div>
      </div>

      <div className="remotes-container">
        {showRemote1 && (
          <div className="remote-wrapper">
            <h3>Remote 1 Microfrontend</h3>
            <Suspense fallback={<div className="loading">Loading Remote 1...</div>}>
              <Remote1App />
            </Suspense>
          </div>
        )}

        {showRemote2 && (
          <div className="remote-wrapper">
            <h3>Remote 2 Microfrontend</h3>
            <Suspense fallback={<div className="loading">Loading Remote 2...</div>}>
              <Remote2App />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
