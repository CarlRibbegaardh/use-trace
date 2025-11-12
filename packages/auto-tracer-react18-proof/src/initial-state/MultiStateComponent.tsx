import React, { useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating multiple useState hooks with labels.
 * Scenario 3: Initial State Detection (Mount) - Source Order
 */

/**
 * A component with multiple useState hooks to verify source order preservation.
 * Each useState produces two entries: value then setter.
 */
export const MultiStateComponent: React.FC = () => {
  const logger = useAutoTracer();

  const [count, setCount] = useState(0);
  logger.labelState(0, "count", count, "setCount", setCount);

  const [name, setName] = useState("default");
  logger.labelState(1, "name", name, "setName", setName);

  return (
    <div>
      {name}: {count}
    </div>
  );
};
