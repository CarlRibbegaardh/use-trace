import React from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating initial prop detection with primitive values.
 * Scenario 1: Initial Prop Detection (Mount)
 */
export interface SimplePropComponentProps {
  name: string;
  count: number;
}

/**
 * A simple component that displays primitive props.
 * Used to verify initial prop detection on mount.
 */
export const SimplePropComponent: React.FC<SimplePropComponentProps> = ({
  name,
  count,
}) => {
  useAutoTracer();

  return (
    <div>
      {name}: {count}
    </div>
  );
};
