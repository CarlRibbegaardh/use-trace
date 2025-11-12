import React, { useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating state change detection.
 * Scenario 7: State Change Detection (Update)
 */

/**
 * A component that updates state to verify state change detection.
 * Used to test state transitions on re-render.
 */
export const StateUpdateComponent: React.FC = () => {
  const logger = useAutoTracer();

  const [count, setCount] = useState(0);
  logger.labelState(0, "count", count, "setCount", setCount);

  return (
    <div>
      <button onClick={() => setCount(5)}>Update Count</button>
      <div>Count: {count}</div>
    </div>
  );
};
