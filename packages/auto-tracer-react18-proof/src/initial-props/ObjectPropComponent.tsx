import React from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating initial prop detection with object props.
 * Scenario 2: Initial Prop Output Formatting (Objects)
 */
export interface User {
  id: number;
  name: string;
}

export interface ObjectPropComponentProps {
  user: User;
}

/**
 * A component with an object prop to verify JSON stringification.
 * Used to test object prop formatting on mount.
 */
export const ObjectPropComponent: React.FC<ObjectPropComponentProps> = ({
  user,
}) => {
  useAutoTracer();

  return <div>{user.name}</div>;
};
