/**
 * Formats a connector line for depth transitions.
 *
 * Pure function - string transformation only.
 * Total function - handles all valid depth values.
 *
 * @param visualDepth - Visual depth level for indentation
 * @param originalDepth - Original fiber depth to display in level label (if enabled)
 * @param showLevel - Whether to include level number
 * @returns Formatted connector string
 */
export function formatConnector(
  visualDepth: number,
  originalDepth: number,
  showLevel: boolean
): string {
  const indent = "  ".repeat(Math.max(visualDepth - 1, 0));
  const levelText = showLevel ? ` (Level: ${originalDepth})` : "";
  return `${indent}└─┐${levelText}`;
}
