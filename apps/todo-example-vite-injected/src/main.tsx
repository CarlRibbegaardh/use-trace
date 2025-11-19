import ReactDOM from "react-dom/client";
import { autoTracer } from "@auto-tracer/react18";
import App from "./App.tsx";

// Initialize autoTracer before anything else
autoTracer({
  // renderer: "console-group",
  // objectRenderingMode: "devtools-json",
  enabled: true,
  showFlags: true,
  includeNonTrackedBranches: false,
  includeReconciled: "always" as const,
  includeSkipped: "never" as const,
  maxFiberDepth: 100,
  filterEmptyNodes: "all",
  enableAutoTracerInternalsLogging: false,
  detectIdenticalValueChanges: true,
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
    {
      objectName: "Unknown",
      propNames: ["value"],
    },
  ],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
