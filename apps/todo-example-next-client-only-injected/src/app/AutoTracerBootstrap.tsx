"use client";

import { autoTracer, isAutoTracerInitialized } from "@auto-tracer/react18";

// Initialize auto-tracing on the client as early as possible
// Avoid duplicate initialization across HMR/strict mode
if (typeof window !== "undefined") {
  try {
    if (!isAutoTracerInitialized()) {
      autoTracer();
    }
  } catch {
    // no-op: guard against SSR or unavailable DevTools hook
  }
}

export function AutoTracerBootstrap(): null {
  return null;
}
