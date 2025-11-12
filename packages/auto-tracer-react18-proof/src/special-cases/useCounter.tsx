import { useState } from "react";

/**
 * Custom hook for testing custom hook detection.
 * Special Case: Custom Hook Detection (with Labels)
 */

export interface UseCounterReturn {
  count: number;
  increment: () => void;
}

/**
 * A custom hook that returns multiple values.
 * Used to verify custom hook state detection with labels.
 */
export const useCounter = (): UseCounterReturn => {
  const [count, setCount] = useState(0);
  const increment = () => setCount((c) => c + 1);

  return { count, increment };
};
