import React, { useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating initial state with objects and arrays.
 * Scenario 4: Initial State Output Formatting
 */

export interface User {
  id: number;
  name: string;
}

/**
 * A component with object and array state to verify JSON stringification.
 * Used to test various state value formats on mount.
 */
export const ObjectStateComponent: React.FC = () => {
  const logger = useAutoTracer();

  const [active, setActive] = useState(true);
  logger.labelState(0, "active", active, "setActive", setActive);

  const [user, setUser] = useState<User>({ id: 1, name: "Alice" });
  logger.labelState(1, "user", user, "setUser", setUser);

  const [items, setItems] = useState([1, 2, 3]);
  logger.labelState(2, "items", items, "setItems", setItems);

  return (
    <div>
      <div>Active: {String(active)}</div>
      <div>User: {user.name}</div>
      <div>Items: {items.join(", ")}</div>
    </div>
  );
};
