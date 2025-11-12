/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file Defines the structure of a React Fiber node for type-safe access.
 */

export interface FiberNode {
  // The type of the component (e.g., function, class, or string for host components).
  elementType?: any;

  // The direct child fiber of this node.
  child?: FiberNode;

  // The sibling fiber of this node.
  sibling?: FiberNode;

  // Bitfield of flags indicating the work to be performed on this fiber.
  flags?: number;

  // The alternate fiber node from the other tree (the work-in-progress or current tree).
  alternate?: FiberNode;

  // The props from the previous render.
  memoizedProps?: Record<string, unknown>;

  // The new props for the current render.
  pendingProps?: Record<string, unknown>;

  // The head of the linked list of hooks for this fiber.
  memoizedState?: Hook;

  // An array of hook names, injected by React DevTools. This is our "blueprint".
  _debugHookTypes?: string[];

  // Debugging information about the source file and line number.
  _debugSource?: {
    fileName: string;
    lineNumber: number;
  };
}

/**
 * Defines the structure of a single hook in the `memoizedState` linked list.
 */
export interface Hook {
  // The current state value of the hook.
  memoizedState: any;

  // The update queue for stateful hooks. Its presence indicates a stateful hook.
  queue: any;

  // A pointer to the next hook in the linked list.
  next: Hook | null;
}
