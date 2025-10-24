export {
  autoTracer,
  isAutoTracerInitialized,
  stopAutoTracer,
  updateAutoTracerOptions,
  useAutoTrace,
} from "./lib/features/autoTracer/index.js";
export type {
  AutoTracerOptions,
  SkippedObjectProp,
} from "./lib/features/autoTracer/index.js";
export type { IUseTrace } from "./lib/interfaces/index.js";
export { useTrace } from "./lib/hooks/index.js";
