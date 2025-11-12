import React, { useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating various state change formatting.
 * Scenario 8: State Change Output Formatting
 */

export interface User {
  id: number;
  name: string;
}

/**
 * A component with various state types to verify formatting rules.
 * Used to test primitive, object, array, and function state changes.
 */
export const FormattingStateComponent: React.FC = () => {
  const logger = useAutoTracer();

  const [count, setCount] = useState(0);
  logger.labelState(0, "count", count, "setCount", setCount);

  const [user, setUser] = useState<User>({ id: 1, name: "Alice" });
  logger.labelState(1, "user", user, "setUser", setUser);

  const [items, setItems] = useState([1, 2, 3]);
  logger.labelState(2, "items", items, "setItems", setItems);

  const [callback, setCallback] = useState<() => void>(() => () => {});
  logger.labelState(3, "callback", callback, "setCallback", setCallback);

  return (
    <div>
      <div>Count: {count}</div>
      <div>User: {user.name}</div>
      <div>Items: {items.join(", ")}</div>
      <div>Callback: present</div>
      <button onClick={() => setCount(5)}>Update Count</button>
      <button onClick={() => setUser({ id: 2, name: "Bob" })}>Update User</button>
      <button onClick={() => setItems([4, 5, 6])}>Update Items</button>
      <button onClick={() => setCallback(() => () => console.log("new"))}>
        Update Callback
      </button>
    </div>
  );
};
