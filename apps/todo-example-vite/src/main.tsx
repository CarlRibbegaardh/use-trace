import ReactDOM from "react-dom/client";
import { autoTracer } from "@auto-tracer/react18";
import App from "./App.tsx";

// Initialize autoTracer before anything else
autoTracer({
  enabled: true,
  showFlags: true,
  includeNonTrackedBranches: false,
  maxFiberDepth: 100,
  enableAutoTracerInternalsLogging: false,
  skippedObjectProps: [
    {
      objectName: "ThemeProvider3",
      propNames: ["theme"],
    },
    {
      objectName: "ThemeProvider2",
      propNames: ["theme"],
    },
    {
      objectName: "ThemeProvider",
      propNames: ["theme"],
    },
    {
      objectName: "MuiContainerRoot",
      propNames: ["ownerState"],
    },
    {
      objectName: "Styled(div)",
      propNames: ["theme"],
    },
    {
      objectName: "Insertion6",
      propNames: ["cache"],
    },
  ],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
