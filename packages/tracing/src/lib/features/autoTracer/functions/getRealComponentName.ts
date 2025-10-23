import { getComponentName } from "./getComponentName.js";

export function getRealComponentName(fiberNode: Record<string, unknown>): string {
  const nodeWithType = fiberNode as {
    type?: {
      render?: { name?: string };
      type?: { name?: string };
    };
    elementType?: unknown;
  };

  // Check if this is a forwardRef component
  if (nodeWithType.type?.render?.name) {
    return nodeWithType.type.render.name;
  }

  // Check if this is a memo component
  if (nodeWithType.type?.type && typeof nodeWithType.type.type === "function") {
    const func = nodeWithType.type.type as { name?: string };
    return func.name || "Unknown";
  }

  // Regular component
  const elementType = nodeWithType.elementType || nodeWithType.type;
  return getComponentName(elementType) || "Unknown";
}
