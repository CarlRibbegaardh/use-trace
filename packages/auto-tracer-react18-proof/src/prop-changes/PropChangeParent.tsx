import React, { useState } from "react";
import { PropChangeChild } from "./PropChangeChild";

/**
 * Parent component that triggers prop changes in child.
 * Scenario 5: Prop Change Detection (Update)
 */

/**
 * A parent component that changes props passed to child.
 * Used to verify prop change detection via parent re-render.
 */
export const PropChangeParent: React.FC = () => {
  const [count, setCount] = useState(5);

  return (
    <>
      <button onClick={() => setCount(10)}>Update</button>
      <PropChangeChild value={count} />
    </>
  );
};
