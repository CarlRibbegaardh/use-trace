import React from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Child component for testing prop change detection.
 * Scenario 5: Prop Change Detection (Update)
 */

export interface PropChangeChildProps {
  value: number;
}

/**
 * Child component that receives props from parent.
 * Used to verify prop change detection when parent triggers re-render.
 */
export const PropChangeChild: React.FC<PropChangeChildProps> = ({ value }) => {
  useAutoTracer();

  return <div>Value: {value}</div>;
};
