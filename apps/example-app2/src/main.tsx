import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { autoTracer } from "@auto-tracer/react18";
autoTracer({
  enabled: true,
  includeReconciled: true,
  showFlags: false,
  includeSkipped: true,
  enableAutoTracerInternalsLogging: true,
  maxFiberDepth: 2,
  includeNonTrackedBranches: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
