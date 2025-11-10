/**
 * Formats a connector line for depth transitions.
 *
 * Pure function - string transformation only.
 * Total function - handles all valid depth values.
 *
 * @param depth - Current depth level
 * @param showLevel - Whether to include level number
 * @returns Formatted connector string
 */
export function formatConnector(depth: number, showLevel: boolean): string {
  const indent = "  ".repeat(Math.max(depth - 1, 0));
  const levelText = showLevel ? ` (Level: ${depth})` : "";
  return `${indent}└─┐${levelText}`;
}
