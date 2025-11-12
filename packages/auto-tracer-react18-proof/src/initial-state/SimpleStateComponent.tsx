import React, { useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating initial state detection with primitive values.
 * Scenario 3: Initial State Detection (Mount)
 */

/**
 * A simple component with basic useState hooks.
 * Used to verify initial state detection on mount.
 */
export const SimpleStateComponent: React.FC = () => {
  const logger = useAutoTracer();

  const [count, setCount] = useState(0);
  logger.labelState(0, "count", count, "setCount", setCount);

  return <div>Count: {count}</div>;
};
