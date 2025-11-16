/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file Defines the structure of a React Fiber node for type-safe access.
 *
 * Canonicalized against React 18.3.1 internals.
 * Reference: reference/react/packages/react-reconciler/src/ReactInternalTypes.js (Fiber)
 * and reference/react/packages/react-reconciler/src/ReactFiberHooks.js (Hook).
 *
 * Notes:
 * - This type is intentionally minimal and only includes fields we read.
 * - Many properties are optional because React’s internals differ between
 *   build types (dev/prod) and component kinds.
 * - In React 18.3.1, `_debugHookTypes` exists only in DEV and may be null.
 * - `_debugSource` is not a Fiber field in 18.3.1 (DevTools derives source from stack frames),
 *   so it is intentionally omitted here.
 */

export interface FiberNode {
  // The type of the component (e.g., function, class, or string for host components).
  elementType?: any;

  // The direct child fiber of this node.
  child?: FiberNode | null;

  // The sibling fiber of this node.
  sibling?: FiberNode | null;

  // Bitfield of flags indicating the work to be performed on this fiber.
  flags?: number;

  // The alternate fiber node from the other tree (the work-in-progress or current tree).
  alternate?: FiberNode | null;

  // The props from the previous render.
  memoizedProps?: any;

  // The new props for the current render.
  pendingProps?: any;

  // The fiber's memoized state. For function components this may be the head
  // of a linked list of hooks, but its exact shape varies by fiber type.
  memoizedState?: any;

  // DEV-only: An array of hook names collected for validation/debugging.
  // In React 18.3.1 this is Array<HookType> | null in DEV builds only.
  _debugHookTypes?: readonly string[] | null;
}

/**
 * Defines the structure of a single hook in the `memoizedState` linked list.
 * Canonicalized against React 18.3.1 (ReactFiberHooks.js `Hook`).
 */
export interface Hook {
  // The current state value of the hook.
  memoizedState: any;

  // The base state used for eager updates/bailouts (present for stateful hooks).
  baseState?: any;

  // The base queue used for eager updates/bailouts (present for stateful hooks).
  baseQueue?: any;

  // The update queue for stateful hooks. Its presence indicates a stateful hook.
  queue: any;

  // A pointer to the next hook in the linked list.
  next: Hook | null;
}
