import React from "react";
import ReactDOM from "react-dom/client";
import { autoTracer } from "use-trace";
import App from "./App.tsx";

// Initialize autoTracer before anything else
autoTracer({
  enabled: true,
  showFlags: true,
  showFunctionContentOnChange: false,
  skipNonTrackedBranches: true,
  maxFiberDepth: 100,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
