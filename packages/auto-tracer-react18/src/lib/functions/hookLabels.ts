/**
 * @file Barrel export for hook label registry functions.
 *
 * This module provides the public API for managing hook labels in React components.
 * Each function is implemented in its own file following the "one export per file" rule.
 *
 * Registry functions are organized in the `hookLabels/registry/` subdirectory.
 */

// Re-export types for backward compatibility
export type { LabelEntry } from "./hookLabels/LabelEntry.js";
export type { FiberAnchor } from "./hookLabels/FiberAnchor.js";

// Re-export all registry functions
export {
  addLabelForGuid,
  getLabelsForGuid,
  getPrevLabelsForGuid,
  savePrevLabelsForGuid,
  clearLabelsForGuid,
  clearAllHookLabels,
  resolveHookLabel,
} from "./hookLabels/registry/index.js";
