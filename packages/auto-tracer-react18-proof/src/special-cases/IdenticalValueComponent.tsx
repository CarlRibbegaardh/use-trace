import React, { useState } from "react";
import { useAutoTracer } from "@auto-tracer/react18";

/**
 * Component demonstrating identical value change detection.
 * Special Case: Identical Value Changes (Warning)
 */

export interface DataObject {
  id: number;
  name: string;
}

/**
 * A component that creates new objects with identical values.
 * Used to verify identical value warning when detectIdenticalValueChanges is enabled.
 */
export const IdenticalValueComponent: React.FC = () => {
  const logger = useAutoTracer();

  const [data, setData] = useState<DataObject>({ id: 1, name: "test" });
  logger.labelState(0, "data", data, "setData", setData);

  return (
    <div>
      <button onClick={() => setData({ id: 1, name: "test" })}>
        Set Identical
      </button>
      <div>Data: {JSON.stringify(data)}</div>
    </div>
  );
};
