/**
 * @file Label entry type definition.
 */

import type { PropertyMetadata } from "../classifyObjectProperties.js";

/**
 * A label entry associates a hook's label with its build-time index and current value.
 * Used for value-based matching with ordinal disambiguation.
 */
export interface LabelEntry {
  /** Build-time ordinal position for ordering (source order) */
  readonly index: number;
  /** Original value (preserves function identity for display) */
  readonly value: unknown;
  /** Normalized value for structural comparison (functions → "(fn)") - computed internally */
  readonly normalizedValue: unknown;
  /** Friendly name (e.g., "filteredTodos") */
  readonly label: string;
  /** Property metadata for object-valued hooks (optional, for structural matching) */
  readonly propertyMetadata?: PropertyMetadata;
}
