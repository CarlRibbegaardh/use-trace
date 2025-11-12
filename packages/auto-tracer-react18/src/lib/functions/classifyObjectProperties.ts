/**
 * @file Classifies object properties as state values or function setters.
 *
 * Uses a deterministic structural rule:
 * - If ALL properties are functions → all are function-valued state
 * - Otherwise → functions are setters/callbacks, non-functions are state
 */

/**
 * Property type classification result.
 */
export type PropertyType = "value" | "function";

/**
 * Metadata describing an object's properties and their classifications.
 */
export interface PropertyMetadata {
  /** Property names in insertion order */
  names: string[];
  /** Type classification for each property */
  types: PropertyType[];
}

/**
 * Classifies an object's properties as state values or function setters.
 *
 * Uses deterministic structural rule:
 * - If ALL properties are functions → classify all as "value" (function-valued state)
 * - Otherwise → functions are "function" (setters), non-functions are "value" (state)
 *
 * @param value - The object to classify
 * @returns Metadata with property names and type classifications, or null if not an object
 *
 * @example
 * ```typescript
 * // Mixed pattern (common): functions are setters
 * classifyObjectProperties({ value: "test", setValue: fn })
 * // → { names: ["value", "setValue"], types: ["value", "function"] }
 *
 * // All functions: function-valued state (microfrontend callbacks)
 * classifyObjectProperties({ onClick: fn, onSubmit: fn })
 * // → { names: ["onClick", "onSubmit"], types: ["value", "value"] }
 *
 * // Multiple state values with setters
 * classifyObjectProperties({ name: "John", setName: fn, email: "j@e.com", setEmail: fn })
 * // → { names: ["name", "setName", "email", "setEmail"], types: ["value", "function", "value", "function"] }
 * ```
 */
export function classifyObjectProperties(value: unknown): PropertyMetadata | null {
  // Only classify objects
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value);

  // Empty object edge case
  if (entries.length === 0) {
    return { names: [], types: [] };
  }

  // Determine if all properties are functions
  const allFunctions = entries.every(([_, val]) => {return typeof val === "function"});

  const names: string[] = [];
  const types: PropertyType[] = [];

  for (const [key, val] of entries) {
    names.push(key);

    if (allFunctions) {
      // All functions → all are function-valued state
      types.push("value");
    } else {
      // Mixed → functions are setters, others are state
      types.push(typeof val === "function" ? "function" : "value");
    }
  }

  return { names, types };
}
