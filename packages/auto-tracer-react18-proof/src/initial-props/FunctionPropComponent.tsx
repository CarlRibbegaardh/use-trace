import React from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating initial prop detection with function props.
 * Scenario 2: Initial Prop Output Formatting (Functions)
 */
export interface FunctionPropComponentProps {
  onClick: () => void;
  label: string;
}

/**
 * A component with a function prop to verify (fn:N) formatting.
 * Used to test function identity tracking on mount.
 */
export const FunctionPropComponent: React.FC<FunctionPropComponentProps> = ({
  onClick,
  label,
}) => {
  useAutoTracer();

  return <button onClick={onClick}>{label}</button>;
};
