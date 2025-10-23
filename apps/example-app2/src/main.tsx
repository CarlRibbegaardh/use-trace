import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { autoTracer } from "use-trace";
autoTracer({
  enabled: true,
  includeReconciled: true,
  showFlags: false,
  includeSkipped: true,
});

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
