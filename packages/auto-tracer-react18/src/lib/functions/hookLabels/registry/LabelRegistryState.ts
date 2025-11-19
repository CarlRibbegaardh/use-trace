/**
 * @file Internal state for the hook label registry.
 * Not exported publicly - only used by registry functions.
 */

import type { LabelEntry } from "../LabelEntry.js";

/**
 * Registry mapping GUID -> array of label entries.
 * @internal
 */
export const guidToLabelsMap = new Map<string, LabelEntry[]>();

/**
 * Registry for storing previous render's labels (before they get cleared).
 * @internal
 */
export const guidToPrevLabelsMap = new Map<string, LabelEntry[]>();
