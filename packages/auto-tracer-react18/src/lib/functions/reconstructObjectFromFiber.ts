/**
 * @file Reconstructs objects from React Fiber hooks using property metadata.
 *
 * Consumes hooks only for properties classified as "value", skipping "function"
 * properties which are reconstructed using the placeholder token.
 */

import { FUNCTION_PLACEHOLDER } from "./normalizeValue.js";
import type { PropertyMetadata } from "./classifyObjectProperties.js";

/**
 * Represents a hook value extracted from React Fiber's memoizedState.
 */
export interface FiberHook {
  /** The hook's position in the component's hook sequence */
  index: number;
  /** The current value stored in memoizedState */
  value: unknown;
}

/**
 * Result of attempting to reconstruct an object from fiber hooks.
 */
export interface ReconstructionResult {
  /** Whether reconstruction succeeded */
  success: boolean;
  /** The reconstructed object if successful, null otherwise */
  value: Record<string, unknown> | null;
  /** Error code if reconstruction failed */
  error?: "insufficient-hooks" | "invalid-metadata";
}

/**
 * Reconstructs an object from React Fiber hooks using property metadata.
 *
 * Only consumes hooks for properties classified as "value". Properties
 * classified as "function" are reconstructed using the placeholder token.
 *
 * @param startIndex - The fiber hook index where reconstruction should begin
 * @param metadata - Property names and type classifications
 * @param availableHooks - All hooks extracted from the fiber
 * @returns Reconstruction result with success status and reconstructed object
 *
 * @example
 * ```typescript
 * const metadata = {
 *   names: ["value", "setValue"],
 *   types: ["value", "function"]
 * };
 * const hooks = [
 *   { index: 0, value: "test" },
 *   { index: 1, value: "other" }
 * ];
 *
 * reconstructObjectFromFiber(0, metadata, hooks)
 * // → { success: true, value: { value: "test", setValue: "(fn)" } }
 * // Only consumed hook 0, skipped hook 1 (setValue is a function)
 * ```
 */
export function reconstructObjectFromFiber(
  startIndex: number,
  metadata: PropertyMetadata,
  availableHooks: readonly FiberHook[]
): ReconstructionResult {
  // Validate metadata
  if (!metadata || metadata.names.length !== metadata.types.length) {
    return {
      success: false,
      value: null,
      error: "invalid-metadata",
    };
  }

  const reconstructed: Record<string, unknown> = {};
  let hookOffset = 0; // Tracks which hook we're consuming

  for (let i = 0; i < metadata.names.length; i++) {
    const propName = metadata.names[i];
    const propType = metadata.types[i];

    // TypeScript guard: arrays validated to have same length above
    if (propName === undefined || propType === undefined) {
      return {
        success: false,
        value: null,
        error: "invalid-metadata",
      };
    }

    if (propType === "function") {
      // Function properties don't consume hooks - use placeholder
      reconstructed[propName] = FUNCTION_PLACEHOLDER;
    } else {
      // Value properties consume the next available hook
      const hookIndex = startIndex + hookOffset;
      const hook = availableHooks.find((h) => {return h.index === hookIndex});

      if (!hook) {
        // Not enough hooks available for reconstruction
        return {
          success: false,
          value: null,
          error: "insufficient-hooks",
        };
      }

      reconstructed[propName] = hook.value;
      hookOffset++; // Move to next hook
    }
  }

  return {
    success: true,
    value: reconstructed,
  };
}
