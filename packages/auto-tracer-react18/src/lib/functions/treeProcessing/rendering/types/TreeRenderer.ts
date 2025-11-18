import type { TreeNode } from "../../types/TreeNode.js";

/**
 * Functional renderer strategy for tree output.
 * Takes the full list of nodes and handles all output logic.
 *
 * @param nodes - The list of tree nodes to render
 */
export type TreeRenderer = (nodes: readonly TreeNode[]) => void;
