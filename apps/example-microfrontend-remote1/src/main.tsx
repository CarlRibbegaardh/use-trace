import ReactDOM from "react-dom/client";
import { autoTracer } from "@auto-tracer/react18";
import App from "./App.tsx";
import "./index.css";

// Initialize AutoTracer for standalone mode
// When loaded as a remote, the host's AutoTracer instance is used
if (!window.__AUTOTRACER_INITIALIZED__) {
  autoTracer({
    enabled: true,
    includeReconciled: "always" as const,
    showFlags: false,
    includeSkipped: "always" as const,
    enableAutoTracerInternalsLogging: true,
    maxFiberDepth: 2,
    includeNonTrackedBranches: true,
  });
  window.__AUTOTRACER_INITIALIZED__ = true;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
