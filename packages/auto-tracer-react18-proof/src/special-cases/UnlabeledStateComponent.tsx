import React, { useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating unlabeled state detection.
 * Special Case: Unlabeled State Detection
 */

/**
 * A component with useState but no labels provided.
 * Used to verify unlabeled hooks show as "unknown".
 */
export const UnlabeledStateComponent: React.FC = () => {
  // No labels provided - don't call labelState
  useAutoTracer();

  const [count] = useState(0);

  return <div>Count: {count}</div>;
};
