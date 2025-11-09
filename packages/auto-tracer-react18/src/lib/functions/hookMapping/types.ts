/**
 * @file Type definitions for the hook mapping domain.
 */

/**
 * Represents a React hook in the memoizedState chain.
 */
export interface Hook {
  memoizedState: unknown;
  baseState?: unknown;
  baseQueue: unknown;
  queue: unknown | null;
  next: Hook | null;
}
