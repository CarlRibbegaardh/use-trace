import {
  getTrackingGUID,
  useAutoTracer as useAutoTracerImpl,
} from "../functions/renderRegistry.js";
import { AUTOTRACER_STATE_MARKER } from "../types/marker.js";
import { useState } from "react";

export function useAutoTracer() {
  // This is the anchor. It forces an entry into React's stateful hook list
  // that we can find later.
  useState(AUTOTRACER_STATE_MARKER);
  return useAutoTracerImpl();
}
