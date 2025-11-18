import type { TreeNode } from "../types/TreeNode.js";
import { createIndentedRenderer } from "./renderers/createIndentedRenderer.js";
import { createConsoleGroupRenderer } from "./renderers/createConsoleGroupRenderer.js";
import { traceOptions } from "../../../types/globalState.js";

/**
 * Renders an array of tree nodes to the console.
 *
 * IMPURE FUNCTION - Performs I/O (console logging).
 * Total function - handles all node arrays safely.
 *
 * Side effects:
 * - Writes to console
 *
 * @param nodes - Array of tree nodes to render
 */
export function renderTree(nodes: readonly TreeNode[]): void {
  const rendererType = traceOptions.renderer ?? "indented";

  const renderer =
    rendererType === "console-group"
      ? createConsoleGroupRenderer()
      : createIndentedRenderer();

  renderer(nodes);
}
