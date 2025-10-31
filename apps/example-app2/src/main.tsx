import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { autoTracer } from "auto-tracer";
autoTracer({
  enabled: true,
  includeReconciled: true,
  showFlags: false,
  includeSkipped: true,
  enableAutoTracerInternalsLogging: true,
  maxFiberDepth: 2,
  skipNonTrackedBranches: false,
});

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
