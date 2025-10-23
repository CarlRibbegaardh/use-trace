export function getComponentName(elementType: unknown): string | null {
  if (!elementType) return null;

  if (typeof elementType === "function") {
    const func = elementType as { name?: string; displayName?: string };
    return func.displayName || func.name || null;
  }

  if (typeof elementType === "object") {
    const obj = elementType as { name?: string; displayName?: string };
    return obj.displayName || obj.name || null;
  }

  return elementType.toString() || "Unknown";
}
