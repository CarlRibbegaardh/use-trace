/**
 * React Fiber Flags - Extracted from React source code
 *
 * Reference: https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberFlags.js
 *
 * These flags are used by React's reconciler to track the state and work that needs
 * to be done on fiber nodes during the render and commit phases.
 *
 * Note: Don't change the core values (NoFlags, PerformedWork, Placement, DidCapture, Hydrating)
 * as they're used by React Dev Tools.
 */

export type Flags = number;

// Core flags - DO NOT CHANGE (used by React Dev Tools)
export const NoFlags = /*                      */ 0b0000000000000000000000000000000;
export const PerformedWork = /*                */ 0b0000000000000000000000000000001; // 1
export const Placement = /*                    */ 0b0000000000000000000000000000010; // 2
export const DidCapture = /*                   */ 0b0000000000000000000000010000000; // 64
export const Hydrating = /*                    */ 0b0000000000000000001000000000000; // 1024

// Mutable flags - can be changed as needed
export const Update = /*                       */ 0b0000000000000000000000000000100; // 4
export const ChildDeletion = /*                */ 0b0000000000000000000000000010000; // 16
export const ContentReset = /*                 */ 0b0000000000000000000000000100000; // 32
export const Callback = /*                     */ 0b0000000000000000000000001000000; // 64
export const ForceClientRender = /*            */ 0b0000000000000000000000100000000; // 256
export const Ref = /*                          */ 0b0000000000000000000001000000000; // 512
export const Snapshot = /*                     */ 0b0000000000000000000010000000000; // 1024
export const Passive = /*                      */ 0b0000000000000000000100000000000; // 2048
export const Visibility = /*                   */ 0b0000000000000000010000000000000; // 16384
export const StoreConsistency = /*             */ 0b0000000000000000100000000000000; // 32768

// Development-only flags
export const PlacementDEV = /*                 */ 0b0000100000000000000000000000000; // 33554432
export const MountLayoutDev = /*               */ 0b0001000000000000000000000000000; // 67108864
export const MountPassiveDev = /*              */ 0b0010000000000000000000000000000; // 134217728

// Side effect flags that don't reset on clones
export const Incomplete = /*                   */ 0b0000000000000001000000000000000; // 65536
export const ShouldCapture = /*                */ 0b0000000000000010000000000000000; // 131072
export const ForceUpdateForLegacySuspense = /* */ 0b0000000000000100000000000000000; // 262144

// Additional flags for special cases
export const PassiveUnmountPendingDev = /*     */ 0b0001000000000000000000000000000; // 1048576
export const ScheduleRetry = /*                */ 0b0010000000000000000000000000000; // 2097152
export const ChildDidSuspend = /*              */ 0b0100000000000000000000000000000; // 4194304
export const DidSuspend = /*                   */ 0b1000000000000000000000000000000; // 8388608

// Aliases for reused bits (OK because they're mutually exclusive for different fiber types)
export const Hydrate = Callback;
export const ScheduleRetryAlias = StoreConsistency;

/**
 * Flag name mappings for debugging display
 * Maps flag values to human-readable names
 * Note: Some flags share the same values due to React's bit reuse for different fiber types
 */
export const FLAG_NAMES: Record<number, string> = {
  1: "PerformedWork",
  2: "Placement",
  4: "Update",
  16: "ChildDeletion",
  32: "ContentReset",
  64: "Callback/DidCapture",
  256: "ForceClientRender",
  512: "Ref",
  1024: "Hydrating/Snapshot",
  2048: "Passive",
  16384: "Visibility",
  32768: "StoreConsistency",
  33554432: "PlacementDEV",
  65536: "Incomplete",
  131072: "ShouldCapture",
  262144: "ForceClientRender",
  524288: "ForceUpdateForLegacySuspense",
  1048576: "PassiveUnmountPendingDev",
  2097152: "ScheduleRetry",
  4194304: "ChildDidSuspend",
  8388608: "DidSuspend",
};

/**
 * Converts a flags number into an array of human-readable flag names
 * @param flags - The numeric flags value from a fiber node
 * @returns Array of flag names that are set
 */
export function getFlagNames(flags: number): string[] {
  const flagNames: string[] = [];

  for (const [flagValue, flagName] of Object.entries(FLAG_NAMES)) {
    const flag = parseInt(flagValue, 10);
    if (flags & flag) {
      flagNames.push(flagName);
    }
  }

  return flagNames;
}

/**
 * Checks if a fiber has specific work flags indicating actual rendering work
 * @param flags - The numeric flags value from a fiber node
 * @returns True if the fiber has flags indicating real work was performed
 */
export function hasRenderWork(flags: number): boolean {
  return Boolean(flags & (PerformedWork | Update | Placement));
}

/**
 * Checks if a fiber is likely a true mount (new component placement)
 * @param flags - The numeric flags value from a fiber node
 * @param hasAlternate - Whether the fiber has an alternate (previous version)
 * @returns True if this appears to be a genuine mount operation
 */
export function isLikelyMount(flags: number, hasAlternate: boolean): boolean {
  // No alternate is the primary indicator of a mount
  if (hasAlternate) return false;

  // Look for placement or mount-specific flags
  return Boolean(flags & (Placement | PlacementDEV | MountLayoutDev | MountPassiveDev));
}
