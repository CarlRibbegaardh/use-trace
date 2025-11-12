import React from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating various prop change formatting sizes.
 * Scenario 6: Prop Change Output Formatting
 */

export interface FormattingPropComponentProps {
  shortValue?: number;
  mediumValue?: Record<string, unknown>;
  longValue?: string;
  functionValue?: () => void;
}

/**
 * A component with various prop types to verify formatting rules.
 * Used to test short (<20 chars), medium (20-200), and long (>200) formatting.
 */
export const FormattingPropComponent: React.FC<
  FormattingPropComponentProps
> = ({ shortValue, mediumValue, longValue, functionValue }) => {
  useAutoTracer();

  return (
    <div>
      <div>Short: {shortValue}</div>
      <div>Medium: {mediumValue ? JSON.stringify(mediumValue) : "none"}</div>
      <div>Long: {longValue?.substring(0, 20)}...</div>
      <div>Function: {functionValue ? "present" : "none"}</div>
    </div>
  );
};
