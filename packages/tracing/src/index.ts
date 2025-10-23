export {
  autoTracer,
  isAutoTracerInitialized,
  stopAutoTracer,
  trackRender,
  updateAutoTracerOptions,
  useTrackRender,
} from "./lib/features/autoTracer/index.js";
export type { AutoTracerOptions } from "./lib/features/autoTracer/index.js";
export type { IUseTrace } from "./lib/interfaces/index.js";
export { useTrace } from "./lib/hooks/index.js";
