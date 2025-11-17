import ReactDOM from "react-dom/client";
import { autoTracer } from "@auto-tracer/react18";
import App from "./App.tsx";
import "./index.css";

// Initialize AutoTracer before React renders
autoTracer({});

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
