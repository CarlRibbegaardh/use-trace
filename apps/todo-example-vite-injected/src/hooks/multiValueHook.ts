import { useState } from "react";

/**
 * A custom hook that returns multiple values in an object.
 * The object reference changes every render, but contains primitive values.
 * This is useful for testing hook labeling with wrapper objects that change reference.
 */
export function useMultiValueHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const [count, setCount] = useState(0);

  // Return a new object every time (reference changes every render)
  // but the primitive values inside may or may not change
  return {
    value,
    count,
    setValue,
    setCount,
    increment: () => setCount(count + 1),
    reset: () => {
      setValue(initialValue);
      setCount(0);
    },
  };
}

/**
 * Returns the primitive values from the multi-value hook result.
 * Useful for comparing actual state values without the function references.
 */
export function getPrimitiveValues(hookResult: ReturnType<typeof useMultiValueHook>) {
  return {
    value: hookResult.value,
    count: hookResult.count,
  };
}
