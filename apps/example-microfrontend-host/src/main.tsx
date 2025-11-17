import ReactDOM from "react-dom/client";
import { autoTracer } from "@auto-tracer/react18";
import App from "./App.tsx";
import "./index.css";

// Initialize AutoTracer before React renders
autoTracer({
  enabled: true,
  includeReconciled: "always" as const,
  showFlags: false,
  includeSkipped: "always" as const,
  enableAutoTracerInternalsLogging: true,
  maxFiberDepth: 2,
  includeNonTrackedBranches: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
