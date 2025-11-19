/**
 * @file Type definition for fiber anchor.
 */

/**
 * Represents a stateful hook in the React fiber's memoizedState chain.
 */
export interface FiberAnchor {
  /** Position in the memoizedState chain */
  readonly index: number;
  /** Current value of the hook */
  readonly value: unknown;
}
