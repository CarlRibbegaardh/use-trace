import React from "react";
import { useAutoTracer } from "@auto-tracer/react18";
import { useCounter } from "./useCounter";

/**
 * Component demonstrating custom hook detection with labels.
 * Special Case: Custom Hook Detection
 */

/**
 * A component using a custom hook to verify labeled custom hook state.
 * Used to test custom hook value extraction with manual labels.
 */
export const CustomHookComponent: React.FC = () => {
  const logger = useAutoTracer();

  const { count, increment } = useCounter();
  logger.labelState(0, "count", count, "increment", increment);

  return (
    <button onClick={increment}>
      Count: {count}
    </button>
  );
};
