import { useTrace } from "@cr/tracing";
import { useState } from "react";

export function Component() {
  const trace = useTrace("Component");
  const [count, setCount] = useState(0);

  // This handleClick function is recreated every time the component is rendered.
  const handleClick = () => {
    setCount(count + 1);
  };

  // You can use trace.state() to log anything that is state of the component.
  trace.state({ count, setCount, handleClick });

  // You always need to call trace.exit() before returning from the function.
  trace.exit();
  return (
    <>
      <h2>"Component"</h2>
      <div>
        This component doesn't use callback and is recreating the eventhandler
        every render.
      </div>
      <div className="card">
        <button onClick={handleClick}>count is {count}</button>
      </div>
    </>
  );
}
