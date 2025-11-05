export function isRefObject<T>(object: unknown): object is React.RefObject<T> {
  // Check if 'current' is the only key in the object
  return (
    typeof object === "object" &&
    object !== null &&
    Object.keys(object).length === 1 &&
    "current" in object
  );
}
