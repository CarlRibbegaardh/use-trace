import type { TreeNode } from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";
import type {
  StateChangeWithWarning,
  PropChangeWithWarning,
} from "../../../../../src/lib/functions/treeProcessing/types/TreeNode.js";

/**
 * Creates a TreeNode for testing with default values.
 */
export function createNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    depth: 0,
    componentName: "TestComponent",
    displayName: "TestComponent",
    renderType: "Rendering",
    flags: 0,
    stateChanges: [],
    propChanges: [],
    componentLogs: [],
    isTracked: false,
    trackingGUID: null,
    hasIdenticalValueWarning: false,
    ...overrides,
  };
}

/**
 * Creates a state change with warning flag for testing.
 */
export function createStateChange(
  name: string,
  value: unknown,
  prevValue: unknown,
  isIdenticalValueChange: boolean = false
): StateChangeWithWarning {
  return {
    name,
    value,
    prevValue,
    hook: { memoizedState: value, queue: null, next: null },
    isIdenticalValueChange,
  };
}

/**
 * Creates a prop change with warning flag for testing.
 */
export function createPropChange(
  name: string,
  value: unknown,
  prevValue: unknown,
  isIdenticalValueChange: boolean = false
): PropChangeWithWarning {
  return {
    name,
    value,
    prevValue,
    isIdenticalValueChange,
  };
}
