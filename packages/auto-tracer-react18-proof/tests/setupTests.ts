import { beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Now safe to import autoTracer (which imports React)
import { autoTracer } from "@auto-tracer/react18";

let stopAutoTracer: (() => void) | undefined;

beforeAll(() => {
  stopAutoTracer = autoTracer({
    enabled: true,
    showFlags: true,
    includeNonTrackedBranches: false,
    maxFiberDepth: 100,
    enableAutoTracerInternalsLogging: false,
    detectIdenticalValueChanges: true,
  });
});

afterEach(() => cleanup());
afterAll(() => stopAutoTracer?.());
